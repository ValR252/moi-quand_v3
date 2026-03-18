/**
 * API Route: Zoom OAuth callback
 * Backend Engineer: Handles Zoom OAuth redirect and stores tokens
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTokensFromCode, getZoomUser, saveZoomTokensForTherapist } from '@/lib/zoom'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state') // therapist_id
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      console.error('Zoom OAuth error:', error)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profile?zoom_error=${encodeURIComponent(error)}`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profile?zoom_error=missing_params`
      )
    }

    const therapistId = state

    // Check if Zoom credentials are configured
    if (!process.env.ZOOM_CLIENT_ID || !process.env.ZOOM_CLIENT_SECRET) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profile?zoom_error=not_configured`
      )
    }

    // Exchange code for tokens
    const tokens = await getTokensFromCode(code)

    // Get Zoom user info
    const userInfo = await getZoomUser(tokens.access_token)

    // Save tokens to database
    await saveZoomTokensForTherapist(therapistId, tokens, userInfo)

    // Redirect back to profile with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profile?zoom_success=true`
    )
  } catch (error) {
    console.error('Error in Zoom callback:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profile?zoom_error=server_error`
    )
  }
}