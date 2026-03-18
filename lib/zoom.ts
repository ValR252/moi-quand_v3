/**
 * Zoom API Configuration & Helpers
 * Backend Engineer: Type-safe Zoom integration for video meetings
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Zoom OAuth endpoints
const ZOOM_OAUTH_URL = 'https://zoom.us/oauth/authorize'
const ZOOM_TOKEN_URL = 'https://zoom.us/oauth/token'
const ZOOM_API_BASE = 'https://api.zoom.us/v2'

// Types
export interface ZoomTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at: number // calculated
}

export interface ZoomUser {
  id: string
  email: string
  first_name: string
  last_name: string
  account_type: number
}

export interface ZoomMeeting {
  id: number
  uuid: string
  join_url: string
  start_url: string
  topic: string
  status: string
  start_time: string
  duration: number
  password?: string
}

// Generate OAuth URL for therapist to connect Zoom
export function getZoomAuthUrl(therapistId: string): string {
  const clientId = process.env.ZOOM_CLIENT_ID
  const redirectUri = encodeURIComponent(process.env.ZOOM_REDIRECT_URI!)
  const state = encodeURIComponent(therapistId)
  
  // Zoom OAuth scopes needed for creating meetings
  const scopes = encodeURIComponent('meeting:write user:read')
  
  return `${ZOOM_OAUTH_URL}?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes}&state=${state}`
}

// Exchange authorization code for tokens
export async function getTokensFromCode(code: string): Promise<ZoomTokens> {
  const clientId = process.env.ZOOM_CLIENT_ID
  const clientSecret = process.env.ZOOM_CLIENT_SECRET
  const redirectUri = process.env.ZOOM_REDIRECT_URI
  
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  
  const response = await fetch(ZOOM_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri!,
    }),
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Zoom token exchange failed: ${error}`)
  }
  
  const data = await response.json()
  
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    expires_at: Date.now() + data.expires_in * 1000,
  }
}

// Refresh access token
export async function refreshAccessToken(refreshToken: string): Promise<ZoomTokens> {
  const clientId = process.env.ZOOM_CLIENT_ID
  const clientSecret = process.env.ZOOM_CLIENT_SECRET
  
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  
  const response = await fetch(ZOOM_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Zoom token refresh failed: ${error}`)
  }
  
  const data = await response.json()
  
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    expires_at: Date.now() + data.expires_in * 1000,
  }
}

// Get Zoom user info
export async function getZoomUser(accessToken: string): Promise<ZoomUser> {
  const response = await fetch(`${ZOOM_API_BASE}/users/me`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get Zoom user: ${error}`)
  }
  
  return response.json()
}

// Save tokens to Supabase for a therapist
export async function saveZoomTokensForTherapist(
  therapistId: string,
  tokens: ZoomTokens,
  userInfo: ZoomUser
) {
  const { error } = await supabase
    .from('therapists')
    .update({
      zoom_connected: true,
      zoom_access_token: tokens.access_token,
      zoom_refresh_token: tokens.refresh_token,
      zoom_token_expiry: new Date(tokens.expires_at).toISOString(),
      zoom_user_id: userInfo.id,
      zoom_email: userInfo.email,
    })
    .eq('id', therapistId)
  
  if (error) throw error
}

// Get tokens from Supabase and refresh if needed
export async function getZoomAccessToken(therapistId: string): Promise<string> {
  // Fetch tokens from Supabase
  const { data: therapist, error } = await supabase
    .from('therapists')
    .select('zoom_access_token, zoom_refresh_token, zoom_token_expiry')
    .eq('id', therapistId)
    .single()
  
  if (error || !therapist) throw new Error('Therapist not found')
  if (!therapist.zoom_access_token) throw new Error('Zoom not connected')
  
  // Check if token is expired (with 5 min buffer)
  const expiryTime = new Date(therapist.zoom_token_expiry!).getTime()
  if (Date.now() > expiryTime - 5 * 60 * 1000) {
    // Token expired, refresh it
    const newTokens = await refreshAccessToken(therapist.zoom_refresh_token!)
    
    // Save new tokens
    await supabase
      .from('therapists')
      .update({
        zoom_access_token: newTokens.access_token,
        zoom_refresh_token: newTokens.refresh_token,
        zoom_token_expiry: new Date(newTokens.expires_at).toISOString(),
      })
      .eq('id', therapistId)
    
    return newTokens.access_token
  }
  
  return therapist.zoom_access_token
}

// Create a Zoom meeting
export async function createZoomMeeting(
  therapistId: string,
  meeting: {
    topic: string
    start_time: string // ISO 8601 datetime
    duration: number // minutes
    timezone: string
    password?: string
  }
): Promise<ZoomMeeting> {
  const accessToken = await getZoomAccessToken(therapistId)
  
  const response = await fetch(`${ZOOM_API_BASE}/users/me/meetings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic: meeting.topic,
      type: 2, // Scheduled meeting
      start_time: meeting.start_time,
      duration: meeting.duration,
      timezone: meeting.timezone,
      password: meeting.password || Math.random().toString(36).substring(2, 8),
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: true,
        waiting_room: true,
        audio: 'both',
        auto_recording: 'none',
        enforce_login: false,
      },
    }),
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create Zoom meeting: ${error}`)
  }
  
  return response.json()
}

// Delete a Zoom meeting
export async function deleteZoomMeeting(therapistId: string, meetingId: string) {
  const accessToken = await getZoomAccessToken(therapistId)
  
  const response = await fetch(`${ZOOM_API_BASE}/meetings/${meetingId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  })
  
  if (!response.ok && response.status !== 404) {
    const error = await response.text()
    throw new Error(`Failed to delete Zoom meeting: ${error}`)
  }
}

// Check if therapist has Zoom connected
export async function hasZoomConnected(therapistId: string): Promise<boolean> {
  const { data } = await supabase
    .from('therapists')
    .select('zoom_connected')
    .eq('id', therapistId)
    .single()
  
  return data?.zoom_connected || false
}

// Disconnect Zoom for a therapist
export async function disconnectZoom(therapistId: string) {
  // Optional: Revoke token on Zoom side
  // For now, just clear our stored tokens
  
  const { error } = await supabase
    .from('therapists')
    .update({
      zoom_connected: false,
      zoom_access_token: null,
      zoom_refresh_token: null,
      zoom_token_expiry: null,
      zoom_user_id: null,
      zoom_email: null,
    })
    .eq('id', therapistId)
  
  if (error) throw error
}

// Get Zoom connection status
export async function getZoomStatus(therapistId: string): Promise<{
  connected: boolean
  email?: string
}> {
  const { data } = await supabase
    .from('therapists')
    .select('zoom_connected, zoom_email')
    .eq('id', therapistId)
    .single()
  
  return {
    connected: data?.zoom_connected || false,
    email: data?.zoom_email || undefined,
  }
}
