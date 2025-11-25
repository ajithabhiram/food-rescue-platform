// Supabase Edge Function: Notify Partners of New Offer
// Triggered via database webhook when new offer is created
// Deploy: supabase functions deploy notify-partners

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { record } = await req.json() // Webhook payload from Supabase
    const offerId = record.id

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get offer details with donor info
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select(`
        *,
        donor:users!donor_id(name, email),
        donor_profile:donor_profiles!donor_id(business_name, address)
      `)
      .eq('id', offerId)
      .single()

    if (offerError || !offer) {
      throw new Error('Offer not found')
    }

    // Find partners in the same zone or within radius
    // For simplicity, get all active partners (you can add zone/distance filtering)
    const { data: partners, error: partnersError } = await supabase
      .from('partner_profiles')
      .select('user_id, users!inner(email, name)')
      .eq('users.banned', false)

    if (partnersError || !partners || partners.length === 0) {
      console.log('No partners to notify')
      return new Response(
        JSON.stringify({ success: true, message: 'No partners to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare email variables
    const variables = {
      title: offer.title,
      donor_name: offer.donor_profile?.business_name || offer.donor.name,
      quantity: offer.quantity_est?.toString() || 'N/A',
      unit: offer.quantity_unit || 'kg',
      food_type: offer.food_type || 'Food',
      pickup_start: new Date(offer.pickup_window_start).toLocaleString(),
      pickup_end: new Date(offer.pickup_window_end).toLocaleString(),
      address: offer.address || 'See map',
      offer_link: `${Deno.env.get('APP_URL')}/offers/${offer.id}`,
    }

    // Send email to each partner
    const emailPromises = partners.map(async (partner) => {
      const partnerVariables = {
        ...variables,
        partner_name: partner.users.name || 'Partner',
      }

      // Call send-email function
      const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          to: partner.users.email,
          templateKey: 'offer_posted',
          variables: partnerVariables,
        }),
      })

      return response.json()
    })

    const results = await Promise.allSettled(emailPromises)
    const successCount = results.filter(r => r.status === 'fulfilled').length

    console.log(`Notified ${successCount}/${partners.length} partners`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notified ${successCount} partners`,
        offer_id: offerId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Notification error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
