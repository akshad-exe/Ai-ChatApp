const mongoose = require('mongoose');
const crypto = require('crypto');

const messageSchema = new mongoose.Schema({
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'audio', 'video'],
    default: 'text'
  },
  mediaUrl: {
    type: String,
    trim: true
  },
  isEncrypted: {
    type: Boolean,
    default: true
  },
  encryptionKey: {
    type: String,
    select: false
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  isAIResponse: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for better query performance
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ 'readBy.user': 1 });

// Method to encrypt message content
messageSchema.methods.encryptContent = async function() {
  if (!this.isEncrypted) return;

  const algorithm = 'aes-256-gcm';
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(this.content, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  this.content = encrypted;
  this.encryptionKey = JSON.stringify({
    key: key.toString('hex'),
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  });
};

// Method to decrypt message content
messageSchema.methods.decryptContent = function(encryptionKey) {
  if (!this.isEncrypted || !encryptionKey) return this.content;

  try {
    const { key, iv, authTag } = JSON.parse(encryptionKey);
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(key, 'hex'),
      Buffer.from(iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(this.content, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return '[Encrypted Message]';
  }
};

// Method to mark message as read
messageSchema.methods.markAsRead = async function(userId) {
  if (!this.readBy.some(read => read.user.toString() === userId.toString())) {
    this.readBy.push({ user: userId });
    await this.save();
  }
};

// Method to get message with populated fields
messageSchema.methods.getMessageDetails = async function() {
  return this.populate([
    { path: 'sender', select: 'username email avatar' },
    { path: 'chat' },
    { path: 'readBy.user', select: 'username email avatar' }
  ]);
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message; 