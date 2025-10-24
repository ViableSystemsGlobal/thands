import { io } from 'socket.io-client';
import { api } from './api';

class ChatService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.currentSessionId = null;
    this.messageHandlers = new Map();
  }

  connect() {
    if (this.socket && this.isConnected) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        // Get auth token for authenticated connections
        const token = api.getToken();
        
        this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3003', {
          auth: {
            token: token
          },
          transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
          console.log('🔌 Connected to chat server');
          this.isConnected = true;
          resolve();
        });

        this.socket.on('disconnect', () => {
          console.log('🔌 Disconnected from chat server');
          this.isConnected = false;
        });

        this.socket.on('error', (error) => {
          console.error('🔌 Chat server error:', error);
          reject(error);
        });

        // Set up message handlers
        this.socket.on('new-message', (message) => {
          this.handleNewMessage(message);
        });

        this.socket.on('chat-history', (history) => {
          this.handleChatHistory(history);
        });

        this.socket.on('lead-processed', (result) => {
          this.handleLeadProcessed(result);
        });

      } catch (error) {
        console.error('Error connecting to chat server:', error);
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentSessionId = null;
    }
  }

  joinSession(sessionId) {
    if (!this.isConnected) {
      return Promise.reject(new Error('Not connected to chat server'));
    }

    this.currentSessionId = sessionId;
    this.socket.emit('join-session', sessionId);
    
    return Promise.resolve();
  }

  sendMessage(message, userInfo = null) {
    if (!this.isConnected || !this.currentSessionId) {
      return Promise.reject(new Error('Not connected or no active session'));
    }

    this.socket.emit('send-message', {
      sessionId: this.currentSessionId,
      message: message.trim(),
      userInfo: userInfo
    });

    return Promise.resolve();
  }

  processLead() {
    if (!this.isConnected || !this.currentSessionId) {
      return Promise.reject(new Error('Not connected or no active session'));
    }

    this.socket.emit('process-lead', this.currentSessionId);
    return Promise.resolve();
  }

  // Event handlers
  onNewMessage(handler) {
    if (!this.messageHandlers.has('new-message')) {
      this.messageHandlers.set('new-message', []);
    }
    this.messageHandlers.get('new-message').push(handler);
  }

  onChatHistory(handler) {
    if (!this.messageHandlers.has('chat-history')) {
      this.messageHandlers.set('chat-history', []);
    }
    this.messageHandlers.get('chat-history').push(handler);
  }

  onLeadProcessed(handler) {
    if (!this.messageHandlers.has('lead-processed')) {
      this.messageHandlers.set('lead-processed', []);
    }
    this.messageHandlers.get('lead-processed').push(handler);
  }

  onError(handler) {
    if (!this.messageHandlers.has('error')) {
      this.messageHandlers.set('error', []);
    }
    this.messageHandlers.get('error').push(handler);
  }

  // Remove event handlers
  offNewMessage(handler) {
    const handlers = this.messageHandlers.get('new-message');
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  offChatHistory(handler) {
    const handlers = this.messageHandlers.get('chat-history');
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  offLeadProcessed(handler) {
    const handlers = this.messageHandlers.get('lead-processed');
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  offError(handler) {
    const handlers = this.messageHandlers.get('error');
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // Internal handlers
  handleNewMessage(message) {
    const handlers = this.messageHandlers.get('new-message');
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('Error in new-message handler:', error);
        }
      });
    }
  }

  handleChatHistory(history) {
    const handlers = this.messageHandlers.get('chat-history');
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(history);
        } catch (error) {
          console.error('Error in chat-history handler:', error);
        }
      });
    }
  }

  handleLeadProcessed(result) {
    const handlers = this.messageHandlers.get('lead-processed');
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(result);
        } catch (error) {
          console.error('Error in lead-processed handler:', error);
        }
      });
    }
  }

  // Utility methods
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getCurrentSessionId() {
    return this.currentSessionId;
  }

  isSessionActive() {
    return this.isConnected && this.currentSessionId !== null;
  }
}

// Create singleton instance
const chatService = new ChatService();

export default chatService;
