const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Import routes
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const userRoutes = require('./routes/userRoutes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/auth');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');

// Import socket service
const SocketService = require('./services/socketService');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Initialize socket service
const socketService = new SocketService(io);

// Make socket service available to routes
app.set('socketService', socketService);

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Security middleware (should be first)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:3000'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600 // 10 minutes
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('dev'));

// Rate limiting middleware
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', authMiddleware, chatRoutes);
app.use('/api/users', authMiddleware, userRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected');

  // Authenticate socket connection
  socket.on('authenticate', async (token) => {
    try {
      const decoded = await authMiddleware.verifyToken(token);
      socket.userId = decoded.userId;
      console.log(`User ${decoded.userId} authenticated on socket`);
    } catch (error) {
      console.error('Socket authentication error:', error);
      socket.disconnect();
    }
  });

  // Join chat room
  socket.on('joinRoom', ({ conversationId }) => {
    if (socket.userId) {
      socket.join(conversationId);
      console.log(`User ${socket.userId} joined room ${conversationId}`);
    }
  });

  // Leave chat room
  socket.on('leaveRoom', ({ conversationId }) => {
    if (socket.userId) {
      socket.leave(conversationId);
      console.log(`User ${socket.userId} left room ${conversationId}`);
    }
  });

  // Handle messages
  socket.on('message', async (message) => {
    if (socket.userId) {
      try {
        // Save message to database
        const savedMessage = await Message.create({
          ...message,
          sender: socket.userId
        });

        // Broadcast to room
        io.to(message.conversationId).emit('message', savedMessage);
      } catch (error) {
        console.error('Error handling message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    }
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    if (socket.userId) {
      socket.to(data.conversationId).emit('typing', {
        userId: socket.userId,
        isTyping: data.isTyping
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 