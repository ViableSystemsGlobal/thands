import { api } from '@/lib/services/api';

// Get knowledge base content for context
export async function getKnowledgeBaseContext() {
  try {
    const data = await api.get('/knowledge-base');
    const items = data.items || data || [];
    return items.map(item =>
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
    const data = await api.post('/chat/session', { userEmail });
    return data.session || data;
  } catch (error) {
    console.error('Error creating chat session:', error);
    return null;
  }
}

// Update chat session with user information
export async function updateChatSessionUserInfo(sessionId, userInfo) {
  try {
    const data = await api.post('/chat/session', {
      sessionId,
      userEmail: userInfo.email,
      userName: userInfo.name,
      userPhone: userInfo.phone,
      userInfoCollected: true,
    });
    console.log('User info updated for session:', sessionId, userInfo);
    return data.session || data;
  } catch (error) {
    console.error('Error updating chat session user info:', error);
    return null;
  }
}

// Save chat message — handled server-side via /chat/message
export async function saveChatMessage(sessionId, message, senderType) {
  // Messages are persisted by the backend when processChatMessage is called.
  // This is a no-op on the frontend to avoid duplicates.
  return null;
}

// Get chat history for a session — not exposed as a standalone endpoint; return empty
export async function getChatHistory(sessionId) {
  return [];
}

// Process chat message using backend API (main function)
export async function processChatMessage(message, sessionId, userEmail = null) {
  try {
    const data = await api.post('/chat/message', { message, sessionId, userEmail });
    return data.response || data.message || 'I apologize, but I\'m having trouble processing your request right now. Please try again later.';
  } catch (error) {
    console.error('Error processing chat message:', error);
    return error.message || 'I apologize, but I\'m having trouble processing your request right now. Please try again later.';
  }
}

// Process chat lead when chat is closed — graceful no-op (no backend equivalent yet)
export async function processChatLead(sessionId) {
  console.log('processChatLead: no backend equivalent implemented, sessionId:', sessionId);
  return { success: false, message: 'Chat lead processing not available' };
}

// Create lead directly — graceful no-op (no backend equivalent yet)
export async function createChatLead(sessionId, customerName, customerEmail, customerPhone = null) {
  console.log('createChatLead: no backend equivalent implemented', { sessionId, customerName, customerEmail });
  return {
    success: false,
    message: 'Chat lead creation not available via backend yet',
  };
}
