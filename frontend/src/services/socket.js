import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Chat methods
  sendMessage(message) {
    if (this.socket) {
      this.socket.emit('sendMessage', message);
    }
  }

  onMessage(callback) {
    if (this.socket) {
      this.socket.on('newMessage', callback);
    }
  }

  // User status methods
  updateUserStatus(status) {
    if (this.socket) {
      this.socket.emit('updateStatus', status);
    }
  }

  onUserStatus(callback) {
    if (this.socket) {
      this.socket.on('userStatus', callback);
    }
  }
}

export default new SocketService(); 