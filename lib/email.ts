/**
 * Email Service using Resend
 * Backend Engineer: Type-safe email sending with Resend
 */

import { Resend } from 'resend'

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

// Email sender configuration
const FROM_EMAIL = process.env.FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'noreply@moi-quand.com'
const FROM_NAME = 'Moi-Quand'

/**
 * Send booking confirmation email to patient
 */
export async function sendBookingConfirmationEmail(params: {
  to: string
  patientName: string
  therapistName: string
  date: string
  time: string
  duration: number
  sessionLabel: string
  cancellationToken: string
  cancellationDeadlineHours: number
}) {
  const { to, patientName, therapistName, date, time, duration, sessionLabel, cancellationToken, cancellationDeadlineHours } = params

  const cancellationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/cancel/${cancellationToken}`

  try {
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject: `Confirmation de votre rendez-vous avec ${therapistName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .booking-details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-row:last-child { border-bottom: none; }
            .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Rendez-vous confirmé</h1>
            </div>
            <div class="content">
              <p>Bonjour ${patientName},</p>
              <p>Votre rendez-vous est confirmé :</p>

              <div class="booking-details">
                <div class="detail-row">
                  <strong>Thérapeute :</strong> ${therapistName}
                </div>
                <div class="detail-row">
                  <strong>Date :</strong> ${new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div class="detail-row">
                  <strong>Heure :</strong> ${time}
                </div>
                <div class="detail-row">
                  <strong>Durée :</strong> ${duration} minutes
                </div>
                <div class="detail-row">
                  <strong>Type de séance :</strong> ${sessionLabel}
                </div>
              </div>

              <p><strong>Besoin de modifier votre rendez-vous ?</strong></p>
              <p>Vous pouvez annuler ou transférer votre rendez-vous jusqu'à ${cancellationDeadlineHours} heures avant.</p>

              <a href="${cancellationUrl}" class="button">Gérer mon rendez-vous</a>

              <div class="footer">
                <p>Cet email a été envoyé automatiquement par Moi-Quand.com</p>
                <p>Si vous avez des questions, veuillez contacter directement votre thérapeute.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    })

    console.log(`Booking confirmation email sent to ${to}`)
  } catch (error) {
    console.error('Error sending booking confirmation email:', error)
    throw error
  }
}

/**
 * Send cancellation confirmation email to patient
 */
export async function sendCancellationEmailToPatient(params: {
  to: string
  patientName: string
  therapistName: string
  date: string
  time: string
  sessionLabel: string
  cancelledBy: 'patient' | 'therapist'
  reason?: string
  willBeRefunded: boolean
}) {
  const { to, patientName, therapistName, date, time, sessionLabel, cancelledBy, reason, willBeRefunded } = params

  try {
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject: `Annulation de votre rendez-vous avec ${therapistName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #DC2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .booking-details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-row:last-child { border-bottom: none; }
            .alert { background-color: #FEF3C7; padding: 15px; border-left: 4px solid #F59E0B; margin: 20px 0; border-radius: 4px; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Rendez-vous annulé</h1>
            </div>
            <div class="content">
              <p>Bonjour ${patientName},</p>
              <p>${cancelledBy === 'therapist' ? 'Votre thérapeute a annulé' : 'Vous avez annulé'} votre rendez-vous :</p>

              <div class="booking-details">
                <div class="detail-row">
                  <strong>Thérapeute :</strong> ${therapistName}
                </div>
                <div class="detail-row">
                  <strong>Date :</strong> ${new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div class="detail-row">
                  <strong>Heure :</strong> ${time}
                </div>
                <div class="detail-row">
                  <strong>Type de séance :</strong> ${sessionLabel}
                </div>
                ${reason ? `
                <div class="detail-row">
                  <strong>Raison :</strong> ${reason}
                </div>
                ` : ''}
              </div>

              ${willBeRefunded ? `
              <div class="alert">
                <strong>💰 Remboursement</strong><br>
                Votre paiement sera remboursé selon la politique du thérapeute.
              </div>
              ` : ''}

              <div class="footer">
                <p>Cet email a été envoyé automatiquement par Moi-Quand.com</p>
                <p>Si vous avez des questions, veuillez contacter directement votre thérapeute.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    })

    console.log(`Cancellation email sent to patient: ${to}`)
  } catch (error) {
    console.error('Error sending cancellation email to patient:', error)
    throw error
  }
}

/**
 * Send cancellation notification email to therapist
 */
export async function sendCancellationEmailToTherapist(params: {
  to: string
  therapistName: string
  patientName: string
  date: string
  time: string
  sessionLabel: string
  cancelledBy: 'patient' | 'therapist'
  reason?: string
}) {
  const { to, therapistName, patientName, date, time, sessionLabel, cancelledBy, reason } = params

  try {
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject: `Annulation : ${patientName} - ${new Date(date).toLocaleDateString('fr-FR')} ${time}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #DC2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .booking-details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-row:last-child { border-bottom: none; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Rendez-vous annulé</h1>
            </div>
            <div class="content">
              <p>Bonjour ${therapistName},</p>
              <p>${cancelledBy === 'patient' ? 'Votre patient a annulé' : 'Vous avez annulé'} le rendez-vous suivant :</p>

              <div class="booking-details">
                <div class="detail-row">
                  <strong>Patient :</strong> ${patientName}
                </div>
                <div class="detail-row">
                  <strong>Date :</strong> ${new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div class="detail-row">
                  <strong>Heure :</strong> ${time}
                </div>
                <div class="detail-row">
                  <strong>Type de séance :</strong> ${sessionLabel}
                </div>
                ${reason ? `
                <div class="detail-row">
                  <strong>Raison :</strong> ${reason}
                </div>
                ` : ''}
              </div>

              <p>Le créneau est maintenant disponible pour de nouvelles réservations.</p>

              <div class="footer">
                <p>Cet email a été envoyé automatiquement par Moi-Quand.com</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    })

    console.log(`Cancellation notification sent to therapist: ${to}`)
  } catch (error) {
    console.error('Error sending cancellation email to therapist:', error)
    throw error
  }
}

/**
 * Send transfer confirmation email to patient
 */
export async function sendTransferEmailToPatient(params: {
  to: string
  patientName: string
  therapistName: string
  oldDate: string
  oldTime: string
  newDate: string
  newTime: string
  sessionLabel: string
  duration: number
  newCancellationToken: string
  cancellationDeadlineHours: number
}) {
  const { to, patientName, therapistName, oldDate, oldTime, newDate, newTime, sessionLabel, duration, newCancellationToken, cancellationDeadlineHours } = params

  const cancellationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/cancel/${newCancellationToken}`

  try {
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject: `Rendez-vous déplacé avec ${therapistName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0891B2; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .booking-details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-row:last-child { border-bottom: none; }
            .old-date { text-decoration: line-through; color: #9ca3af; }
            .new-date { color: #059669; font-weight: bold; }
            .button { display: inline-block; padding: 12px 24px; background-color: #0891B2; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Rendez-vous déplacé</h1>
            </div>
            <div class="content">
              <p>Bonjour ${patientName},</p>
              <p>Votre rendez-vous a été déplacé avec succès :</p>

              <div class="booking-details">
                <div class="detail-row">
                  <strong>Thérapeute :</strong> ${therapistName}
                </div>
                <div class="detail-row">
                  <strong>Ancienne date :</strong><br>
                  <span class="old-date">${new Date(oldDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} à ${oldTime}</span>
                </div>
                <div class="detail-row">
                  <strong>Nouvelle date :</strong><br>
                  <span class="new-date">${new Date(newDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} à ${newTime}</span>
                </div>
                <div class="detail-row">
                  <strong>Durée :</strong> ${duration} minutes
                </div>
                <div class="detail-row">
                  <strong>Type de séance :</strong> ${sessionLabel}
                </div>
              </div>

              <p><strong>Besoin de modifier à nouveau ?</strong></p>
              <p>Vous pouvez annuler ou transférer votre rendez-vous jusqu'à ${cancellationDeadlineHours} heures avant.</p>

              <a href="${cancellationUrl}" class="button">Gérer mon rendez-vous</a>

              <div class="footer">
                <p>Cet email a été envoyé automatiquement par Moi-Quand.com</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    })

    console.log(`Transfer confirmation email sent to ${to}`)
  } catch (error) {
    console.error('Error sending transfer email to patient:', error)
    throw error
  }
}
