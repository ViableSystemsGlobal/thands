import { supabase } from './supabase';

// Get knowledge base content for context
export async function getKnowledgeBaseContext() {
  try {
    const { data, error } = await supabase
      .from('knowledge_base')
      .select('title, content, category')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching knowledge base:', error);
      return '';
    }

    return data.map(item => 
      `Title: ${item.title}\nCategory: ${item.category || 'General'}\nContent: ${item.content}`
    ).join('\n\n---\n\n');
  } catch (error) {
    console.error('Error getting knowledge base context:', error);
    return '';
  }
}

// Create or get chat session
export async function createChatSession(userEmail = null) {
  try {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert([
        {
          session_id: sessionId,
          user_email: userEmail,
          is_active: true
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating chat session:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating chat session:', error);
    return null;
  }
}

// Update chat session with user information
export async function updateChatSessionUserInfo(sessionId, userInfo) {
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .update({
        user_email: userInfo.email,
        user_name: userInfo.name,
        user_phone: userInfo.phone,
        user_info_collected: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating chat session user info:', error);
      return null;
    }

    console.log('✅ User info updated for session:', sessionId, userInfo);
    return data;
  } catch (error) {
    console.error('Error updating chat session user info:', error);
    return null;
  }
}

// Save chat message
export async function saveChatMessage(sessionId, message, senderType) {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([
        {
          session_id: sessionId,
          message: message,
          sender_type: senderType
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error saving chat message:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error saving chat message:', error);
    return null;
  }
}

// Get chat history for a session
export async function getChatHistory(sessionId) {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('message, sender_type, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching chat history:', error);
      return [];
    }

    return data;
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return [];
  }
}

// Process chat message using edge function (main function)
export async function processChatMessage(message, sessionId, userEmail = null) {
  try {
    const { data, error } = await supabase.functions.invoke('chat-bot', {
      body: { message, sessionId, userEmail }
    });

    if (error) {
      console.error('Error calling chat-bot function:', error);
      return error.message || 'I apologize, but I\'m having trouble processing your request right now. Please try again later.';
    }

    return data.response;
  } catch (error) {
    console.error('Error processing chat message:', error);
    return error.message || 'I apologize, but I\'m having trouble processing your request right now. Please try again later.';
  }
}

// Process chat lead when chat is closed
export async function processChatLead(sessionId) {
  try {
    console.log('📞 Calling process-chat-lead function with sessionId:', sessionId);
    
    const { data, error } = await supabase.functions.invoke('process-chat-lead', {
      body: { sessionId }
    });

    console.log('📨 Function response:', { data, error });

    if (error) {
      console.error('❌ Function error:', error);
      throw error;
    }

    console.log('✅ Function data:', data);
    return data;
  } catch (error) {
    console.error('💥 Error processing chat lead:', error);
    throw error;
  }
}

// Create lead directly (fallback function)
export async function createChatLead(sessionId, customerName, customerEmail, customerPhone = null) {
  try {
    console.log('📝 Creating chat lead directly:', { sessionId, customerName, customerEmail, customerPhone });
    
    // Get chat messages for summary
    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('message, sender_type, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages for lead:', messagesError);
      throw messagesError;
    }

    // Generate summary
    const userMessages = messages.filter(msg => msg.sender_type === 'user');
    const assistantMessages = messages.filter(msg => msg.sender_type === 'assistant');
    
    let summary = `Chat session with ${userMessages.length} customer messages and ${assistantMessages.length} assistant responses.\n\n`;
    
    // Add key topics
    const allUserText = userMessages.map(msg => msg.message).join(' ').toLowerCase();
    const topics = [];
    
    if (allUserText.includes('suit') || allUserText.includes('formal')) topics.push('suits');
    if (allUserText.includes('kaftan')) topics.push('kaftans');
    if (allUserText.includes('shirt')) topics.push('shirts');
    if (allUserText.includes('wedding')) topics.push('wedding attire');
    if (allUserText.includes('consultation')) topics.push('consultation');
    if (allUserText.includes('price') || allUserText.includes('cost')) topics.push('pricing');
    if (allUserText.includes('delivery') || allUserText.includes('shipping')) topics.push('delivery');
    if (allUserText.includes('size') || allUserText.includes('measurement')) topics.push('sizing');
    
    if (topics.length > 0) {
      summary += `Topics discussed: ${topics.join(', ')}\n\n`;
    }
    
    // Add customer info
    summary += `Customer Information:\n`;
    summary += `- Name: ${customerName}\n`;
    summary += `- Email: ${customerEmail}\n`;
    if (customerPhone) summary += `- Phone: ${customerPhone}\n`;
    summary += `\n`;
    
    // Add sample messages
    summary += "Recent customer messages:\n";
    userMessages.slice(-3).forEach((msg, index) => {
      summary += `${index + 1}. ${msg.message}\n`;
    });
    
    // Calculate duration
    const firstMessage = messages[0];
    const lastMessage = messages[messages.length - 1];
    const durationMinutes = Math.round(
      (new Date(lastMessage.created_at).getTime() - new Date(firstMessage.created_at).getTime()) / 60000
    );

    // Create lead
    const leadData = {
      session_id: sessionId,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      chat_summary: summary,
      message_count: messages.length,
      chat_duration_minutes: durationMinutes,
      status: 'new',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: lead, error: leadError } = await supabase
      .from('chat_leads')
      .insert(leadData)
      .select()
      .single();

    if (leadError) {
      console.error('Error creating lead:', leadError);
      throw leadError;
    }

    console.log('✅ Lead created successfully:', lead);
    return {
      success: true,
      lead: lead,
      customerInfo: { name: customerName, email: customerEmail, phone: customerPhone },
      messageCount: messages.length,
      chatDuration: durationMinutes
    };
  } catch (error) {
    console.error('💥 Error creating chat lead:', error);
    throw error;
  }
}