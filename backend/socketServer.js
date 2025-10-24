const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { query } = require('./config/database');
const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Create socket server
function createSocketServer(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        // Allow anonymous connections for chat
        socket.user = null;
        return next();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      // Allow anonymous connections for chat
      socket.user = null;
      next();
    }
  });

  // Knowledge base context (you can expand this)
  const getKnowledgeBaseContext = async () => {
    try {
      const result = await query(
        'SELECT title, content, category FROM knowledge_base WHERE is_active = true ORDER BY created_at DESC'
      );
      return result.rows.map(item => 
        `Title: ${item.title}\nCategory: ${item.category || 'General'}\nContent: ${item.content}`
      ).join('\n\n---\n\n');
    } catch (error) {
      console.error('Error fetching knowledge base:', error);
      return '';
    }
  };

  // Generate AI response
  const generateAIResponse = async (message, chatHistory = [], knowledgeBase = '') => {
    try {
      const messages = [
        {
          role: 'system',
          content: `You are a helpful customer service assistant for Tailored Hands, a bespoke fashion and tailoring business. Use the following knowledge base to answer questions accurately. If you don't know something from the knowledge base, politely say so and offer to help with what you do know.

Knowledge Base:
${knowledgeBase}

Instructions:
- Be friendly, professional, and helpful
- Focus on fashion, tailoring, orders, and customer service topics
- If asked about technical issues, direct them to contact support
- Keep responses concise but informative
- Don't make up information not in the knowledge base`
        }
      ];

      // Add chat history
      chatHistory.forEach(msg => {
        messages.push({
          role: msg.sender_type === 'user' ? 'user' : 'assistant',
          content: msg.message
        });
      });

      // Add current message
      messages.push({
        role: 'user',
        content: message
      });

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error generating AI response:', error);
      return 'I apologize, but I\'m having trouble processing your request right now. Please try again later or contact our support team directly.';
    }
  };

  // Store active sessions
  const activeSessions = new Map();

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`, socket.user ? `(authenticated: ${socket.user.email})` : '(anonymous)');

    // Join session room
    socket.on('join-session', async (sessionId) => {
      try {
        socket.join(sessionId);
        
        // Get or create session
        let session = activeSessions.get(sessionId);
        if (!session) {
          // Create new session in database
          const result = await query(
            'INSERT INTO chat_sessions (session_id, user_email, is_active) VALUES ($1, $2, $3) RETURNING *',
            [sessionId, socket.user?.email || null, true]
          );
          session = {
            id: result.rows[0].id,
            sessionId,
            messages: [],
            userEmail: socket.user?.email || null,
            createdAt: new Date()
          };
          activeSessions.set(sessionId, session);
        }

        // Send chat history
        const history = await query(
          'SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC',
          [session.id]
        );
        
        socket.emit('chat-history', history.rows);
        
        // Send welcome message if no history
        if (history.rows.length === 0) {
          const welcomeMessage = {
            id: Date.now(),
            message: "Hello! I'm here to help you with any questions about our bespoke fashion and tailoring services. How can I assist you today?",
            sender_type: 'assistant',
            session_id: session.id,
            created_at: new Date()
          };
          
          await query(
            'INSERT INTO chat_messages (session_id, message, sender_type, created_at) VALUES ($1, $2, $3, $4)',
            [session.id, welcomeMessage.message, 'assistant', welcomeMessage.created_at]
          );
          
          socket.emit('new-message', welcomeMessage);
        }
      } catch (error) {
        console.error('Error joining session:', error);
        socket.emit('error', { message: 'Failed to join chat session' });
      }
    });

    // Handle new message
    socket.on('send-message', async (data) => {
      try {
        const { sessionId, message, userInfo } = data;
        
        if (!message || message.length > 1000) {
          socket.emit('error', { message: 'Invalid message length' });
          return;
        }

        // Get session
        let session = activeSessions.get(sessionId);
        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        // Save user message
        const userMessage = {
          id: Date.now(),
          message: message.trim(),
          sender_type: 'user',
          session_id: session.id,
          created_at: new Date()
        };

        await query(
          'INSERT INTO chat_messages (session_id, message, sender_type, created_at) VALUES ($1, $2, $3, $4)',
          [session.id, userMessage.message, 'user', userMessage.created_at]
        );

        // Emit user message to all clients in session
        io.to(sessionId).emit('new-message', userMessage);

        // Update session with user info if provided
        if (userInfo && (userInfo.name || userInfo.email || userInfo.phone)) {
          await query(
            'UPDATE chat_sessions SET user_name = $1, user_email = $2, user_phone = $3, updated_at = NOW() WHERE id = $4',
            [userInfo.name, userInfo.email, userInfo.phone, session.id]
          );
        }

        // Generate AI response
        const chatHistory = await query(
          'SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC LIMIT 10',
          [session.id]
        );

        const knowledgeBase = await getKnowledgeBaseContext();
        const aiResponse = await generateAIResponse(message, chatHistory.rows, knowledgeBase);

        // Save AI response
        const assistantMessage = {
          id: Date.now() + 1,
          message: aiResponse,
          sender_type: 'assistant',
          session_id: session.id,
          created_at: new Date()
        };

        await query(
          'INSERT INTO chat_messages (session_id, message, sender_type, created_at) VALUES ($1, $2, $3, $4)',
          [session.id, assistantMessage.message, 'assistant', assistantMessage.created_at]
        );

        // Emit AI response to all clients in session
        io.to(sessionId).emit('new-message', assistantMessage);

      } catch (error) {
        console.error('Error handling message:', error);
        socket.emit('error', { message: 'Failed to process message' });
      }
    });

    // Handle lead processing
    socket.on('process-lead', async (sessionId) => {
      try {
        const session = activeSessions.get(sessionId);
        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        // Get session data
        const sessionData = await query(
          'SELECT * FROM chat_sessions WHERE id = $1',
          [session.id]
        );

        if (sessionData.rows.length === 0) {
          socket.emit('error', { message: 'Session not found in database' });
          return;
        }

        const sessionInfo = sessionData.rows[0];

        // Create lead if we have user info
        if (sessionInfo.user_name || sessionInfo.user_email || sessionInfo.user_phone) {
          const leadResult = await query(
            `INSERT INTO chat_leads (session_id, customer_name, customer_email, customer_phone, status, created_at) 
             VALUES ($1, $2, $3, $4, 'new', NOW()) RETURNING *`,
            [session.sessionId, sessionInfo.user_name, sessionInfo.user_email, sessionInfo.user_phone]
          );

          // Mark session as processed
          await query(
            'UPDATE chat_sessions SET is_processed = true, updated_at = NOW() WHERE id = $1',
            [session.id]
          );

          socket.emit('lead-processed', { success: true, leadId: leadResult.rows[0].id });
        } else {
          socket.emit('lead-processed', { success: false, message: 'No user information available' });
        }
      } catch (error) {
        console.error('Error processing lead:', error);
        socket.emit('error', { message: 'Failed to process lead' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
}

module.exports = { createSocketServer };
