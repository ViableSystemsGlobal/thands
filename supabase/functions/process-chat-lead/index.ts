import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const { sessionId } = await req.json()

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Session ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Processing chat lead for session:', sessionId)

    // Get chat session info with user data
    const { data: sessionData, error: sessionError } = await supabaseClient
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError) {
      console.error('Error fetching session:', sessionError)
      throw new Error('Failed to fetch chat session')
    }

    if (!sessionData) {
      console.log('No session found for:', sessionId)
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get chat messages for this session
    const { data: messages, error: messagesError } = await supabaseClient
      .from('chat_messages')
      .select('message, sender_type, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      throw new Error('Failed to fetch chat messages')
    }

    if (!messages || messages.length === 0) {
      console.log('No messages found for session:', sessionId)
      return new Response(
        JSON.stringify({ error: 'No messages found for session' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${messages.length} messages for session ${sessionId}`)

    // Extract customer information from session and messages
    const customerInfo = extractCustomerInfo(sessionData, messages)
    console.log('Extracted customer info:', customerInfo)
    
    // Generate enhanced chat summary
    const chatSummary = await generateEnhancedChatSummary(messages, customerInfo)
    console.log('Generated chat summary:', chatSummary.substring(0, 150) + '...')
    
    // Calculate chat duration
    const firstMessage = messages[0]
    const lastMessage = messages[messages.length - 1]
    const durationMinutes = Math.round(
      (new Date(lastMessage.created_at).getTime() - new Date(firstMessage.created_at).getTime()) / 60000
    )

    console.log('Chat duration:', durationMinutes, 'minutes')

    // Check if lead already exists for this session
    const { data: existingLead, error: existingLeadError } = await supabaseClient
      .from('chat_leads')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (existingLeadError && existingLeadError.code !== 'PGRST116') {
      console.error('Error checking existing lead:', existingLeadError)
      throw new Error('Failed to check existing lead')
    }

    // Prepare lead data
    const leadData = {
      session_id: sessionId,
      customer_name: customerInfo.name,
      customer_email: customerInfo.email,
      customer_phone: customerInfo.phone,
      chat_summary: chatSummary,
      message_count: messages.length,
      chat_duration_minutes: durationMinutes,
      status: 'new',
      updated_at: new Date().toISOString()
    }

    let lead
    if (existingLead) {
      // Update existing lead
      console.log('Updating existing lead:', existingLead.id)
      const { data: updatedLead, error: updateError } = await supabaseClient
        .from('chat_leads')
        .update(leadData)
        .eq('id', existingLead.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating lead:', updateError)
        throw new Error(`Failed to update lead: ${updateError.message}`)
      }
      lead = updatedLead
    } else {
      // Create new lead
      console.log('Creating new lead with data:', leadData)
      const { data: newLead, error: leadError } = await supabaseClient
        .from('chat_leads')
        .insert(leadData)
        .select()
        .single()

      if (leadError) {
        console.error('Error creating lead:', leadError)
        throw new Error(`Failed to create lead: ${leadError.message}`)
      }
      lead = newLead
    }

    console.log('Lead processed successfully:', lead)

    // Update session to mark lead as processed
    await supabaseClient
      .from('chat_sessions')
      .update({ 
        lead_processed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        lead: lead,
        customerInfo: customerInfo,
        messageCount: messages.length,
        chatDuration: durationMinutes,
        isUpdate: !!existingLead
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in process-chat-lead function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        details: error.stack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

function extractCustomerInfo(sessionData, messages) {
  // First, try to get info from session data (preferred)
  let name = sessionData.user_name || null
  let email = sessionData.user_email || null
  let phone = sessionData.user_phone || null
  
  // If session data is incomplete, try to extract from messages
  if (!name || !email) {
    const userMessages = messages.filter(msg => msg.sender_type === 'user')
    
    for (const message of userMessages) {
      const text = message.message.toLowerCase()
      
      // Extract email using regex
      if (!email) {
        const emailMatch = message.message.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/)
        if (emailMatch) {
          email = emailMatch[0]
        }
      }
      
      // Extract name - look for patterns like "my name is", "I'm", etc.
      if (!name) {
        const namePatterns = [
          /(?:my name is|i'm|i am|call me|name's)\s+([a-zA-Z\s]+)/i,
          /^([a-zA-Z\s]+)$/i // Simple name pattern for single word responses
        ]
        
        for (const pattern of namePatterns) {
          const nameMatch = message.message.match(pattern)
          if (nameMatch) {
            const extractedName = nameMatch[1].trim()
            // Validate it's actually a name (not too long, contains letters)
            if (extractedName.length > 1 && extractedName.length < 50 && /^[a-zA-Z\s]+$/.test(extractedName)) {
              name = extractedName
              break
            }
          }
        }
      }
      
      // Extract phone number
      if (!phone) {
        const phoneMatch = message.message.match(/[\+]?[1-9][\d\s\-\(\)]{6,20}/)
        if (phoneMatch) {
          const cleanPhone = phoneMatch[0].replace(/[^\d\+]/g, '')
          if (cleanPhone.length >= 7) {
            phone = cleanPhone
          }
        }
      }
    }
  }
  
  return { name, email, phone }
}

async function generateEnhancedChatSummary(messages, customerInfo) {
  const userMessages = messages.filter(msg => msg.sender_type === 'user')
  const assistantMessages = messages.filter(msg => msg.sender_type === 'assistant')
  
  if (userMessages.length === 0) {
    return "Customer viewed welcome message but didn't respond."
  }
  
  // Create comprehensive summary
  let summary = `=== CHAT LEAD SUMMARY ===\n\n`
  
  // Customer Information Section
  summary += `📋 CUSTOMER INFORMATION:\n`
  summary += `• Name: ${customerInfo.name || 'Not provided'}\n`
  summary += `• Email: ${customerInfo.email || 'Not provided'}\n`
  summary += `• Phone: ${customerInfo.phone || 'Not provided'}\n\n`
  
  // Chat Statistics
  summary += `📊 CHAT STATISTICS:\n`
  summary += `• Total Messages: ${messages.length}\n`
  summary += `• Customer Messages: ${userMessages.length}\n`
  summary += `• Assistant Responses: ${assistantMessages.length}\n`
  summary += `• Chat Duration: ${Math.round((new Date(messages[messages.length - 1].created_at).getTime() - new Date(messages[0].created_at).getTime()) / 60000)} minutes\n\n`
  
  // Topics and Interests
  const allUserText = userMessages.map(msg => msg.message).join(' ').toLowerCase()
  const topics: string[] = []
  const interests: string[] = []
  
  // Product interests
  if (allUserText.includes('suit') || allUserText.includes('formal')) {
    topics.push('suits')
    interests.push('formal wear')
  }
  if (allUserText.includes('kaftan')) {
    topics.push('kaftans')
    interests.push('traditional wear')
  }
  if (allUserText.includes('shirt')) {
    topics.push('shirts')
    interests.push('casual wear')
  }
  if (allUserText.includes('wedding')) {
    topics.push('wedding attire')
    interests.push('special occasions')
  }
  if (allUserText.includes('consultation')) {
    topics.push('consultation')
    interests.push('personalized service')
  }
  if (allUserText.includes('price') || allUserText.includes('cost')) {
    topics.push('pricing')
    interests.push('budget considerations')
  }
  if (allUserText.includes('delivery') || allUserText.includes('shipping')) {
    topics.push('delivery')
    interests.push('shipping options')
  }
  if (allUserText.includes('size') || allUserText.includes('measurement')) {
    topics.push('sizing')
    interests.push('fit and measurements')
  }
  if (allUserText.includes('custom') || allUserText.includes('bespoke')) {
    topics.push('custom tailoring')
    interests.push('bespoke services')
  }
  
  if (topics.length > 0) {
    summary += `🎯 TOPICS DISCUSSED:\n`
    topics.forEach(topic => summary += `• ${topic}\n`)
    summary += `\n`
  }
  
  if (interests.length > 0) {
    summary += `💡 CUSTOMER INTERESTS:\n`
    interests.forEach(interest => summary += `• ${interest}\n`)
    summary += `\n`
  }
  
  // Recent conversation highlights
  summary += `💬 RECENT CONVERSATION HIGHLIGHTS:\n`
  const relevantMessages = userMessages.slice(-5) // Last 5 user messages
  relevantMessages.forEach((msg, index) => {
    const truncated = msg.message.length > 100 ? msg.message.substring(0, 100) + '...' : msg.message
    summary += `${index + 1}. "${truncated}"\n`
  })
  
  // Lead quality assessment
  summary += `\n📈 LEAD QUALITY ASSESSMENT:\n`
  let leadScore = 0
  let qualityNotes: string[] = []
  
  if (customerInfo.name && customerInfo.email) {
    leadScore += 30
    qualityNotes.push('Complete contact information provided')
  }
  if (customerInfo.phone) {
    leadScore += 20
    qualityNotes.push('Phone number available for direct contact')
  }
  if (userMessages.length >= 3) {
    leadScore += 25
    qualityNotes.push('Engaged conversation with multiple messages')
  }
  if (topics.includes('consultation') || topics.includes('custom tailoring')) {
    leadScore += 25
    qualityNotes.push('Showed interest in high-value services')
  }
  
  summary += `• Lead Score: ${leadScore}/100\n`
  summary += `• Quality Notes:\n`
  qualityNotes.forEach(note => summary += `  - ${note}\n`)
  
  // Recommended follow-up actions
  summary += `\n🎯 RECOMMENDED FOLLOW-UP ACTIONS:\n`
  if (leadScore >= 70) {
    summary += `• HIGH PRIORITY: Contact within 24 hours\n`
    summary += `• Schedule consultation call\n`
  } else if (leadScore >= 40) {
    summary += `• MEDIUM PRIORITY: Contact within 48 hours\n`
    summary += `• Send personalized email with product recommendations\n`
  } else {
    summary += `• LOW PRIORITY: Add to newsletter and follow up in 1 week\n`
  }
  
  if (interests.includes('special occasions')) {
    summary += `• Focus on wedding/formal wear offerings\n`
  }
  if (interests.includes('budget considerations')) {
    summary += `• Provide transparent pricing information\n`
  }
  if (interests.includes('personalized service')) {
    summary += `• Emphasize bespoke consultation services\n`
  }
  
  return summary
} 