// Supabase Edge Function: Send Email via Google SMTP
// Deploy: supabase functions deploy send-email

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface EmailRequest {
  to: string
  subject: string
  html: string
  text: string
  templateKey?: string
  variables?: Record<string, string>
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    })
  }

  try {
    const { to, subject, html, text, templateKey, variables }: EmailRequest = await req.json()

    // Get SMTP config from environment
    const smtpHost = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com'
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '587')
    const smtpUser = Deno.env.get('SMTP_USER')
    const smtpPass = Deno.env.get('SMTP_PASS')
    const smtpFrom = Deno.env.get('SMTP_FROM') || smtpUser

    if (!smtpUser || !smtpPass) {
      throw new Error('SMTP credentials not configured')
    }

    // If template key provided, fetch and render template
    let finalHtml = html
    let finalText = text
    let finalSubject = subject

    if (templateKey && variables) {
      // Fetch template from database
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseKey)

      const { data: template, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('template_key', templateKey)
        .eq('active', true)
        .single()

      if (error || !template) {
        throw new Error(`Template ${templateKey} not found`)
      }

      // Simple variable replacement
      finalSubject = replaceVariables(template.subject, variables)
      finalHtml = replaceVariables(template.body_html, variables)
      finalText = replaceVariables(template.body_text, variables)
    }

    // Connect to SMTP server
    const client = new SmtpClient()
    await client.connectTLS({
      hostname: smtpHost,
      port: smtpPort,
      username: smtpUser,
      password: smtpPass,
    })

    // Send email
    await client.send({
      from: smtpFrom,
      to: to,
      subject: finalSubject,
      content: finalText,
      html: finalHtml,
    })

    await client.close()

    // Log notification in database
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get user ID from email
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', to)
      .single()

    if (user) {
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'email',
        subject: finalSubject,
        payload: { to, template_key: templateKey },
        sent_at: new Date().toISOString(),
      })
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Email send error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

function replaceVariables(template: string, variables: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value)
  }
  return result
}
