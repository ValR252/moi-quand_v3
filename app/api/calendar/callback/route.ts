// API Route: Handle Google Calendar OAuth callback
import { NextRequest, NextResponse } from 'next/server'
import { getTokensFromCode, saveTokensForTherapist } from '@/lib/google-calendar'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state') // therapist ID
    const error = searchParams.get('error')

    // Handle user denial
    if (error) {
      return NextResponse.redirect(
        new URL('/dashboard?calendar_error=denied', request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dashboard?calendar_error=invalid', request.url)
      )
    }

    // Exchange code for tokens
    const tokens = await getTokensFromCode(code)

    // Save tokens to Supabase
    await saveTokensForTherapist(state, tokens)

    // Redirect back to dashboard with success
    // Redirect to dashboard with calendar selection modal
    return NextResponse.redirect(
      new URL('/dashboard?calendar_success=true&show_calendar_selector=true', request.url)
    )  } catch (error) {
    console.error('Error in calendar callback:', error)
    return NextResponse.redirect(
      new URL('/dashboard?calendar_error=unknown', request.url)
    )
  }
}
