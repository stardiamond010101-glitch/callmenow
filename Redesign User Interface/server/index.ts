import express from 'express'
import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'
import cors from 'cors'
import bodyParser from 'body-parser'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://xktfijpjnflzkibknwen.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey!)

// Twilio client (optional, for making outbound calls)
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Twilio webhook server is running' })
})

// Main Twilio webhook endpoint
app.post('/webhook/twilio', async (req, res) => {
  console.log('Twilio webhook received:', req.body)

  try {
    const {
      CallSid,
      From,
      CallStatus,
      Direction,
      Digits,
      DialCallStatus,
      CallDuration,
    } = req.body

    // Handle incoming call - IVR prompt
    if (CallStatus === 'ringing' && !Digits) {
      // Create call record
      const { error } = await supabase
        .from('calls')
        .insert({
          caller_number: From,
          status: 'ringing',
          twilio_call_sid: CallSid,
          started_at: new Date().toISOString(),
        })

      if (error) console.error('Error creating call record:', error)

      // Return TwiML for IVR
      const twiml = `
        <Response>
          <Gather action="/webhook/twilio" method="POST" numDigits="4" timeout="10">
            <Say>Welcome to CallMeNow. Please enter your creator's 4-digit extension code.</Say>
          </Gather>
          <Say>We didn't receive your input. Goodbye.</Say>
          <Hangup/>
        </Response>
      `
      res.type('text/xml')
      return res.send(twiml)
    }

    // Handle extension input
    if (Digits && Digits.length === 4) {
      // Find user by extension code
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, phone_number, display_name, is_available')
        .eq('extension_code', Digits)
        .single()

      if (error || !profile) {
        const twiml = `
          <Response>
            <Say>Extension not found. Please check the code and try again.</Say>
            <Hangup/>
          </Response>
        `
        res.type('text/xml')
        return res.send(twiml)
      }

      // Update call record with user_id
      await supabase
        .from('calls')
        .update({ user_id: profile.id })
        .eq('twilio_call_sid', CallSid)

      // Check if creator is available
      if (!profile.is_available || !profile.phone_number) {
        await supabase
          .from('calls')
          .update({ status: 'missed', ended_at: new Date().toISOString() })
          .eq('twilio_call_sid', CallSid)

        // Create activity
        await supabase
          .from('activities')
          .insert({
            user_id: profile.id,
            activity_type: 'missed_call',
            title: 'Missed Call',
            description: `${From} tried ext. ${Digits}`,
          })

        const twiml = `
          <Response>
            <Say>The creator is currently unavailable. Please try again later.</Say>
            <Hangup/>
          </Response>
        `
        res.type('text/xml')
        return res.send(twiml)
      }

      // Route call to creator's phone
      const twiml = `
        <Response>
          <Dial action="/webhook/twilio" method="POST" callerId="${From}">
            ${profile.phone_number}
          </Dial>
        </Response>
      `
      res.type('text/xml')
      return res.send(twiml)
    }

    // Handle call completed
    if (CallStatus === 'completed' || CallStatus === 'busy' || CallStatus === 'no-answer' || CallStatus === 'canceled') {
      const durationSeconds = parseInt(CallDuration) || 0
      const durationMinutes = durationSeconds / 60

      // Get call record
      const { data: call } = await supabase
        .from('calls')
        .select('user_id')
        .eq('twilio_call_sid', CallSid)
        .single()

      if (call && call.user_id) {
        // Get user's rate
        const { data: profile } = await supabase
          .from('profiles')
          .select('per_minute_rate')
          .eq('id', call.user_id)
          .single()

        const rate = profile?.per_minute_rate || 4.00
        const amountCharged = durationMinutes * rate

        const finalStatus = DialCallStatus === 'completed' ? 'answered' :
                          DialCallStatus === 'busy' ? 'declined' : 'missed'

        // Update call record
        await supabase
          .from('calls')
          .update({
            status: finalStatus,
            duration_seconds: durationSeconds,
            amount_charged: amountCharged,
            ended_at: new Date().toISOString(),
          })
          .eq('twilio_call_sid', CallSid)

        // Update revenue daily
        const today = new Date().toISOString().split('T')[0]
        await supabase.rpc('upsert_revenue_daily', {
          p_user_id: call.user_id,
          p_date: today,
          p_total_calls: 1,
          p_answered_calls: finalStatus === 'answered' ? 1 : 0,
          p_missed_calls: finalStatus === 'missed' ? 1 : 0,
          p_declined_calls: finalStatus === 'declined' ? 1 : 0,
          p_total_minutes: durationMinutes,
          p_total_revenue: amountCharged,
        })

        // Update total earned
        if (amountCharged > 0) {
          await supabase
            .from('profiles')
            .update({
              total_earned: (await supabase
                .from('profiles')
                .select('total_earned')
                .eq('id', call.user_id)
                .single())
                .data?.total_earned || 0 + amountCharged
            })
            .eq('id', call.user_id)
        }

        // Create activity
        await supabase
          .from('activities')
          .insert({
            user_id: call.user_id,
            activity_type: 'call_ended',
            title: finalStatus === 'answered' ? 'Call Completed' : 'Call Missed',
            description: `${From} · ${Math.floor(durationMinutes)} mins · $${amountCharged.toFixed(2)}`,
          })
      }
    }

    res.type('text/xml')
    res.send('<Response></Response>')
  } catch (error) {
    console.error('Error in Twilio webhook:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.listen(PORT, () => {
  console.log(`Twilio webhook server running on port ${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/health`)
  console.log(`Webhook URL: http://localhost:${PORT}/webhook/twilio`)
})
