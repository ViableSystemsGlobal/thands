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

    const { message, sessionId, userEmail } = await req.json()

    if (!message || !sessionId) {
      return new Response(
        JSON.stringify({ error: 'Message and session ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get client IP address
    const clientIP = req.headers.get('cf-connecting-ip') || 
                    req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    '127.0.0.1'

    // Check rate limits
    const { data: rateLimitCheck, error: rateLimitError } = await supabaseClient
      .rpc('check_chat_rate_limit', { ip_addr: clientIP })

    if (rateLimitError) {
      console.error('Rate limit check failed:', rateLimitError)
    } else if (!rateLimitCheck.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          message: rateLimitCheck.reason,
          retryAfter: rateLimitCheck.retry_after || rateLimitCheck.blocked_until
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get knowledge base content
    const { data: knowledgeBase, error: kbError } = await supabaseClient
      .from('knowledge_base')
      .select('title, content, category')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (kbError) {
      console.error('Error fetching knowledge base:', kbError)
    }

    const knowledgeBaseContext = knowledgeBase?.map(item => 
      `Title: ${item.title}\nCategory: ${item.category || 'General'}\nContent: ${item.content}`
    ).join('\n\n---\n\n') || ''

    // Create or update session with IP tracking - try with fallback
    let session;
    let sessionError;
    
    // First try with all fields
    try {
      const { data, error } = await supabaseClient
        .from('chat_sessions')
        .upsert({
          id: sessionId,
          session_id: sessionId, // Add this for backward compatibility
          user_email: userEmail,
          last_message_at: new Date().toISOString(),
          ip_address: clientIP,
          user_agent: req.headers.get('user-agent') || 'Unknown'
        })
        .select()
        .single();
      
      session = data;
      sessionError = error;
    } catch (err) {
      console.error('Full session upsert failed, trying basic upsert:', err);
      
      // Fallback to basic session creation without new fields
      const { data, error } = await supabaseClient
        .from('chat_sessions')
        .upsert({
          id: sessionId,
          session_id: sessionId, // Add this for backward compatibility
          user_email: userEmail,
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();
      
      session = data;
      sessionError = error;
    }

    if (sessionError) {
      console.error('Session error details:', sessionError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create or update session', 
          details: sessionError.message,
          hint: 'Please ensure the chat_sessions table has the required columns'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get chat history for timing analysis
    const { data: chatHistory, error: historyError } = await supabaseClient
      .from('chat_messages')
      .select('message, sender_type, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (historyError) {
      console.error('Error fetching chat history:', historyError)
    }

    // Calculate time since last message
    const lastMessage = chatHistory?.[chatHistory.length - 1]
    const timeSinceLastMessage = lastMessage 
      ? Math.floor((Date.now() - new Date(lastMessage.created_at).getTime()) / 1000)
      : 0

    // Check for abuse before processing
    const { data: abuseCheck, error: abuseError } = await supabaseClient
      .rpc('detect_chat_abuse', {
        session_uuid: sessionId,
        message_text: message,
        ip_addr: clientIP,
        time_since_last: timeSinceLastMessage
      })

    if (abuseError) {
      console.error('Abuse detection failed:', abuseError)
    } else if (abuseCheck?.abuse_detected) {
      console.log('Abuse detected:', abuseCheck)
      return new Response(
        JSON.stringify({ 
          error: 'Message flagged',
          response: "I'm sorry, but I can't process this message. Please contact our support team if you need assistance."
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Save user message with metadata
    const { error: saveUserError } = await supabaseClient
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        message: message,
        sender_type: 'user',
        message_length: message.length,
        time_since_last_message: timeSinceLastMessage
      })

    if (saveUserError) {
      console.error('Error saving user message:', saveUserError)
    }

    // Increment message count for rate limiting
    const { error: incrementError } = await supabaseClient
      .rpc('increment_message_count', { ip_addr: clientIP })

    if (incrementError) {
      console.error('Error incrementing message count:', incrementError)
    }

    // Build messages for OpenAI
    const messages = [
      {
        role: 'system',
        content: `You are a helpful customer service assistant for Tailored Hands, a premium bespoke fashion and tailoring business. Your primary goal is to provide personalized service and gather customer information to better assist them.

Knowledge Base:
${knowledgeBaseContext}

Primary Objectives:
1. Collect customer information (name, preferences, occasion, style needs)
2. Provide personalized recommendations based on their needs
3. Guide them toward scheduling consultations or making purchases
4. Answer questions using the knowledge base

Instructions:
- Be warm, professional, and engaging
- Always try to personalize responses using any information they've shared
- If they haven't shared their name, gently ask for it to provide better service
- Ask follow-up questions to understand their needs better
- Focus on fashion, tailoring, bespoke services, and customer service
- Recommend specific services or products when appropriate
- Encourage consultations for bespoke pieces
- Keep responses conversational but informative
- Don't make up information not in the knowledge base
- If asked about technical issues, direct them to contact support at sales@tailoredhands.africa

Customer Service Focus:
- Lead generation through information collection
- Personalized recommendations
- Consultation booking encouragement
- Building relationships through conversation`
      }
    ]

    // Add chat history
    if (chatHistory) {
      chatHistory.forEach(msg => {
        messages.push({
          role: msg.sender_type === 'user' ? 'user' : 'assistant',
          content: msg.message
        })
      })
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message
    })

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7
      })
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json()
      console.error('OpenAI API error:', errorData)
      throw new Error('Failed to get response from OpenAI')
    }

    const openaiData = await openaiResponse.json()
    const aiResponse = openaiData.choices[0].message.content

    // Save AI response
    const { error: saveAIError } = await supabaseClient
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        message: aiResponse,
        sender_type: 'assistant'
      })

    if (saveAIError) {
      console.error('Error saving AI message:', saveAIError)
    }

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in chat-bot function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        response: "I'm sorry, I'm having trouble processing your request right now. Please try again later or contact our support team directly."
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
}) 