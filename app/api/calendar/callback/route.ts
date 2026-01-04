// API Route: Handle Google Calendar OAuth callback
import { NextRequest, NextResponse } from 'next/server'
import { getTokensFromCode, saveTokensForTherapist } from '@/lib/google-calendar'

export async function GET(request: NextRequest) {
  try {
    console.log('=== Calendar Callback Called ===')

    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state') // therapist ID
    const error = searchParams.get('error')

    console.log('Callback params:', { hasCode: !!code, state, error })

    // Handle user denial
    if (error) {
      console.log('User denied access')
      return NextResponse.redirect(
        new URL('/dashboard?calendar_error=denied', request.url)
      )
    }

    if (!code || !state) {
      console.log('Missing code or state')
      return NextResponse.redirect(
        new URL('/dashboard?calendar_error=invalid', request.url)
      )
    }

    console.log('Exchanging code for tokens...')
    // Exchange code for tokens
    const tokens = await getTokensFromCode(code)
    console.log('Tokens received:', { hasAccessToken: !!tokens.access_token, hasRefreshToken: !!tokens.refresh_token })

    console.log('Saving tokens to Supabase for therapist:', state)
    // Save tokens to Supabase
    await saveTokensForTherapist(state, tokens)
    console.log('Tokens saved successfully')

    // Redirect back to profile page with success message
    return NextResponse.redirect(
      new URL('/dashboard/profile?calendar_success=true', request.url)
    )  } catch (error) {
    console.error('Error in calendar callback:', error)
    return NextResponse.redirect(
      new URL('/dashboard?calendar_error=unknown', request.url)
    )
  }
}
