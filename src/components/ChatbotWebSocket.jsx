import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Bot, User, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useAuth } from '../hooks/useAuth';
import chatService from '../lib/chatService';

const ChatbotWebSocket = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: '', email: '', phone: '' });
  const [isCollectingInfo, setIsCollectingInfo] = useState(false);
  const [infoStep, setInfoStep] = useState(0); // 0: name, 1: email, 2: phone (optional)
  const [hasCollectedInfo, setHasCollectedInfo] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  // Initialize chat session
  useEffect(() => {
    if (isOpen && !sessionId) {
      initializeChatSession();
    }
  }, [isOpen]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Show notification when chatbot is closed and new message arrives
  useEffect(() => {
    if (!isOpen && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === 'assistant') {
        setHasNewMessage(true);
      }
    }
  }, [messages, isOpen]);

  // Set up chat service event handlers
  useEffect(() => {
    const handleNewMessage = (message) => {
      const formattedMessage = {
        id: message.id,
        text: message.message,
        sender: message.sender_type === 'user' ? 'user' : 'assistant',
        timestamp: new Date(message.created_at)
      };
      
      setMessages(prev => [...prev, formattedMessage]);
      setIsLoading(false);
    };

    const handleChatHistory = (history) => {
      const formattedHistory = history.map(msg => ({
        id: msg.id,
        text: msg.message,
        sender: msg.sender_type === 'user' ? 'user' : 'assistant',
        timestamp: new Date(msg.created_at)
      }));
      setMessages(formattedHistory);
    };

    const handleLeadProcessed = (result) => {
      console.log('Lead processed:', result);
      if (result.success) {
        // Show success message
        const successMessage = {
          id: Date.now() + 999,
          text: "✅ Thank you! Your conversation has been saved and our team will follow up with you soon.",
          sender: 'assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, successMessage]);
      }
    };

    const handleError = (error) => {
      console.error('Chat error:', error);
      setIsLoading(false);
    };

    // Register event handlers
    chatService.onNewMessage(handleNewMessage);
    chatService.onChatHistory(handleChatHistory);
    chatService.onLeadProcessed(handleLeadProcessed);
    chatService.onError(handleError);

    // Cleanup handlers on unmount
    return () => {
      chatService.offNewMessage(handleNewMessage);
      chatService.offChatHistory(handleChatHistory);
      chatService.offLeadProcessed(handleLeadProcessed);
      chatService.offError(handleError);
    };
  }, []);

  const initializeChatSession = async () => {
    try {
      setIsLoading(true);
      
      // Connect to chat service
      await chatService.connect();
      setIsConnected(true);

      // Generate new session ID
      const newSessionId = chatService.generateSessionId();
      setSessionId(newSessionId);

      // Join session
      await chatService.joinSession(newSessionId);
      
      console.log('✅ Chat session initialized:', newSessionId);
    } catch (error) {
      console.error('❌ Error initializing chat session:', error);
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !sessionId || !isConnected) return;

    // Client-side rate limiting (2 seconds between messages)
    const now = Date.now();
    const timeSinceLastMessage = now - (window.lastMessageTime || 0);
    
    if (timeSinceLastMessage < 2000) {
      const errorMessage = {
        id: Date.now() + 1,
        text: "Please wait a moment before sending another message.",
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    // Check message length
    if (inputMessage.length > 1000) {
      const errorMessage = {
        id: Date.now() + 1,
        text: "Your message is too long. Please keep it under 1000 characters.",
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    window.lastMessageTime = now;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      // Handle user info collection
      if (isCollectingInfo) {
        await handleUserInfoCollection(currentMessage);
        setIsLoading(false);
        return;
      }

      // Send message via WebSocket
      const currentUserInfo = user ? {
        name: user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : userInfo.name,
        email: user.email || userInfo.email,
        phone: user.phone || userInfo.phone
      } : userInfo;

      await chatService.sendMessage(currentMessage, currentUserInfo);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble processing your message. Please try again.",
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const handleUserInfoCollection = async (message) => {
    switch (infoStep) {
      case 0: // Name
        setUserInfo(prev => ({ ...prev, name: message }));
        setInfoStep(1);
        const emailPrompt = {
          id: Date.now() + 1,
          text: "Great! What's your email address?",
          sender: 'assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, emailPrompt]);
        break;
      case 1: // Email
        setUserInfo(prev => ({ ...prev, email: message }));
        setInfoStep(2);
        const phonePrompt = {
          id: Date.now() + 1,
          text: "Perfect! What's your phone number? (Optional - you can skip by typing 'skip')",
          sender: 'assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, phonePrompt]);
        break;
      case 2: // Phone
        if (message.toLowerCase() !== 'skip') {
          setUserInfo(prev => ({ ...prev, phone: message }));
        }
        setIsCollectingInfo(false);
        setHasCollectedInfo(true);
        const welcomeMessage = {
          id: Date.now() + 1,
          text: `Nice to meet you, ${userInfo.name}! Now I can help you with any questions about our bespoke fashion and tailoring services. What would you like to know?`,
          sender: 'assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, welcomeMessage]);
        break;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleChat = async () => {
    console.log('🔄 toggleChat called', { 
      isOpen, 
      sessionId, 
      messageCount: messages.length,
      hasMessages: messages.length > 1,
      hasCollectedInfo,
      userInfo,
      willProcessLead: isOpen && sessionId && messages.length > 1 && hasCollectedInfo
    });

    // If closing the chat and we have a session with user info, process the lead
    if (isOpen && sessionId && messages.length > 1 && hasCollectedInfo) {
      console.log('🔄 Processing chat lead...', { 
        sessionId, 
        messageCount: messages.length,
        userInfo
      });
      
      // Show a small notification that lead is being processed
      const leadProcessingMessage = {
        id: Date.now() + 999,
        text: "💼 Thank you for chatting with us! We're saving your conversation so we can follow up with personalized recommendations...",
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, leadProcessingMessage]);
      
      try {
        await chatService.processLead();
        console.log('✅ Chat lead processing initiated');
        
        // Remove the processing message after a delay
        setTimeout(() => {
          setMessages(prev => prev.filter(msg => msg.id !== leadProcessingMessage.id));
        }, 2000);
        
      } catch (error) {
        console.error('❌ Error processing chat lead:', error);
        
        // Remove the processing message even if there's an error
        setTimeout(() => {
          setMessages(prev => prev.filter(msg => msg.id !== leadProcessingMessage.id));
        }, 1000);
      }
    }

    setIsOpen(!isOpen);
    setHasNewMessage(false);

    if (!isOpen) {
      setIsMinimized(false);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <Button
            onClick={toggleChat}
            className="h-14 w-14 rounded-full bg-[#D2B48C] hover:bg-[#C19A6B] shadow-lg transition-all duration-300 hover:scale-105"
            size="icon"
          >
            {hasNewMessage && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs">
                1
              </Badge>
            )}
            <MessageCircle className="h-6 w-6 text-white" />
          </Button>
        )}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
          isMinimized ? 'h-16' : 'h-[600px]'
        } w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden`}>
          {/* Header */}
          <div className="bg-[#D2B48C] text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5" />
              <span className="font-medium">TailoredHands Assistant</span>
              {isConnected && (
                <div className="h-2 w-2 bg-green-400 rounded-full"></div>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <Button
                onClick={toggleMinimize}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                onClick={toggleChat}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 p-4 h-[480px]">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] rounded-lg p-3 ${
                        message.sender === 'user'
                          ? 'bg-[#D2B48C] text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        <div className="flex items-start space-x-2">
                          {message.sender === 'assistant' && (
                            <Bot className="h-4 w-4 mt-0.5 text-gray-600" />
                          )}
                          {message.sender === 'user' && (
                            <User className="h-4 w-4 mt-0.5 text-white" />
                          )}
                          <div>
                            <p className="text-sm">{message.text}</p>
                            <p className={`text-xs mt-1 ${
                              message.sender === 'user' ? 'text-white/70' : 'text-gray-500'
                            }`}>
                              {formatTime(message.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                        <div className="flex items-center space-x-2">
                          <Bot className="h-4 w-4 text-gray-600" />
                          <div className="flex space-x-1">
                            <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={isLoading || !isConnected}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading || !isConnected}
                    className="bg-[#D2B48C] hover:bg-[#C19A6B] text-white"
                    size="sm"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                {!isConnected && (
                  <p className="text-xs text-red-500 mt-2">Connecting to chat server...</p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ChatbotWebSocket;
