import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const formData = await req.formData()
    const callSid = formData.get('CallSid') as string
    const callerNumber = formData.get('From') as string
    const callStatus = formData.get('CallStatus') as string
    const direction = formData.get('Direction') as string

    console.log('Twilio webhook:', { callSid, callerNumber, callStatus, direction })

    // Handle different call events
    if (callStatus === 'ringing') {
      // Incoming call started - create call record
      const { error } = await supabase
        .from('calls')
        .insert({
          caller_number: callerNumber,
          status: 'ringing',
          twilio_call_sid: callSid,
          started_at: new Date().toISOString(),
          // We'll need to determine user_id from extension later
        })

      if (error) console.error('Error creating call record:', error)

      // Return TwiML for IVR - ask for extension
      const twiml = `
        <Response>
          <Gather action="/functions/v1/twilio-webhook" method="POST" numDigits="4" timeout="10">
            <Say>Welcome to CallMeNow. Please enter your creator's 4-digit extension code.</Say>
          </Gather>
          <Say>We didn't receive your input. Goodbye.</Say>
          <Hangup/>
        </Response>
      `
      return new Response(twiml, {
        headers: { ...corsHeaders, 'Content-Type': 'application/xml' },
      })
    }

    // Handle extension input
    const digits = formData.get('Digits') as string
    if (digits && digits.length === 4) {
      // Find user by extension code
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, phone_number, display_name, is_available')
        .eq('extension_code', digits)
        .single()

      if (error || !profile) {
        const twiml = `
          <Response>
            <Say>Extension not found. Please check the code and try again.</Say>
            <Hangup/>
          </Response>
        `
        return new Response(twiml, {
          headers: { ...corsHeaders, 'Content-Type': 'application/xml' },
        })
      }

      // Update call record with user_id
      await supabase
        .from('calls')
        .update({ user_id: profile.id })
        .eq('twilio_call_sid', callSid)

      // Check if creator is available
      if (!profile.is_available || !profile.phone_number) {
        await supabase
          .from('calls')
          .update({ status: 'missed', ended_at: new Date().toISOString() })
          .eq('twilio_call_sid', callSid)

        // Create activity
        await supabase
          .from('activities')
          .insert({
            user_id: profile.id,
            activity_type: 'missed_call',
            title: 'Missed Call',
            description: `${callerNumber} tried ext. ${digits}`,
          })

        const twiml = `
          <Response>
            <Say>The creator is currently unavailable. Please try again later.</Say>
            <Hangup/>
          </Response>
        `
        return new Response(twiml, {
          headers: { ...corsHeaders, 'Content-Type': 'application/xml' },
        })
      }

      // Route call to creator's phone
      const twiml = `
        <Response>
          <Dial action="/functions/v1/twilio-webhook" method="POST" callerId="${callerNumber}">
            ${profile.phone_number}
          </Dial>
        </Response>
      `
      return new Response(twiml, {
        headers: { ...corsHeaders, 'Content-Type': 'application/xml' },
      })
    }

    // Handle call completed
    if (callStatus === 'completed' || callStatus === 'busy' || callStatus === 'no-answer' || callStatus === 'canceled') {
      const dialCallStatus = formData.get('DialCallStatus') as string
      const callDuration = formData.get('CallDuration') as string

      // Update call record
      const { data: call } = await supabase
        .from('calls')
        .select('user_id, per_minute_rate')
        .eq('twilio_call_sid', callSid)
        .single()

      if (call) {
        const durationSeconds = parseInt(callDuration) || 0
        const durationMinutes = durationSeconds / 60
        const profile = await supabase
          .from('profiles')
          .select('per_minute_rate')
          .eq('id', call.user_id)
          .single()

        const rate = profile.data?.per_minute_rate || 4.00
        const amountCharged = durationMinutes * rate

        const finalStatus = dialCallStatus === 'completed' ? 'answered' : 
                          dialCallStatus === 'busy' ? 'declined' : 'missed'

        await supabase
          .from('calls')
          .update({
            status: finalStatus,
            duration_seconds: durationSeconds,
            amount_charged: amountCharged,
            ended_at: new Date().toISOString(),
          })
          .eq('twilio_call_sid', callSid)

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
            .update({ total_earned: supabase.raw(`total_earned + ${amountCharged}`) })
            .eq('id', call.user_id)
        }

        // Create activity
        await supabase
          .from('activities')
          .insert({
            user_id: call.user_id,
            activity_type: 'call_ended',
            title: finalStatus === 'answered' ? 'Call Completed' : 'Call Missed',
            description: `${callerNumber} · ${Math.floor(durationMinutes)} mins · $${amountCharged.toFixed(2)}`,
          })
      }
    }

    return new Response('OK', { headers: corsHeaders })
  } catch (error) {
    console.error('Error in Twilio webhook:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
