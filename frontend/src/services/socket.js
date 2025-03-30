import { io } from 'socket.io-client';
import { authService } from './auth';

class SocketService {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
  }

  connect() {
    const token = authService.getToken();
    if (!token) {
      console.error('No authentication token available');
      return;
    }

    this.socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      auth: { token },
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to socket server');
      this.reconnectAttempts = 0;
      this.emit('socketConnected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from socket server:', reason);
      this.emit('socketDisconnected', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.emit('socketError', error);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.emit('socketError', error);
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      this.reconnectAttempts = attemptNumber;
      this.emit('reconnectAttempt', attemptNumber);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Failed to reconnect to socket server');
      this.emit('reconnectFailed');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  // Event handling methods
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  // Chat methods
  sendMessage(message) {
    if (!this.socket?.connected) {
      throw new Error('Socket is not connected');
    }
    this.socket.emit('sendMessage', message);
  }

  onMessage(callback) {
    this.on('newMessage', callback);
  }

  // User status methods
  updateUserStatus(status) {
    if (!this.socket?.connected) {
      throw new Error('Socket is not connected');
    }
    this.socket.emit('updateStatus', status);
  }

  onUserStatus(callback) {
    this.on('userStatus', callback);
  }

  // Room methods
  joinRoom(roomId) {
    if (!this.socket?.connected) {
      throw new Error('Socket is not connected');
    }
    this.socket.emit('joinRoom', roomId);
  }

  leaveRoom(roomId) {
    if (!this.socket?.connected) {
      throw new Error('Socket is not connected');
    }
    this.socket.emit('leaveRoom', roomId);
  }

  // Typing indicator
  sendTypingStatus(roomId, isTyping) {
    if (!this.socket?.connected) {
      throw new Error('Socket is not connected');
    }
    this.socket.emit('typing', { roomId, isTyping });
  }

  onTypingStatus(callback) {
    this.on('typing', callback);
  }
}

export default new SocketService(); 