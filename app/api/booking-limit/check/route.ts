import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { addMonths, startOfDay, parseISO } from 'date-fns'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/booking-limit/check
 * Vérifie si une date de réservation est dans la limite autorisée
 * Query params: therapist_id, date (YYYY-MM-DD)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const therapistId = searchParams.get('therapist_id')
    const dateStr = searchParams.get('date')

    if (!therapistId || !dateStr) {
      return NextResponse.json(
        { error: 'Missing required parameters: therapist_id and date' },
        { status: 400 }
      )
    }

    // Récupérer la limite de réservation du thérapeute
    const { data: therapist, error } = await supabase
      .from('therapists')
      .select('booking_limit_months')
      .eq('id', therapistId)
      .single()

    if (error) {
      console.error('Error fetching therapist:', error)
      return NextResponse.json(
        { error: 'Failed to fetch therapist' },
        { status: 500 }
      )
    }

    // Limite par défaut: 2 mois
    const bookingLimitMonths = therapist?.booking_limit_months ?? 2
    const selectedDate = parseISO(dateStr)
    const today = startOfDay(new Date())
    const maxDate = addMonths(today, bookingLimitMonths)

    const isWithinLimit = selectedDate <= maxDate
    const isInPast = selectedDate < today

    return NextResponse.json({
      isValid: isWithinLimit && !isInPast,
      isWithinLimit,
      isInPast,
      bookingLimitMonths,
      maxDate: maxDate.toISOString().split('T')[0],
      message: isInPast 
        ? 'La date sélectionnée est dans le passé'
        : isWithinLimit 
          ? 'Date valide'
          : `Les réservations ne sont possibles que jusqu'à ${bookingLimitMonths} mois à l'avance`
    })
  } catch (error) {
    console.error('Error checking booking limit:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}