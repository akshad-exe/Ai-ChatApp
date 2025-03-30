const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'audio', 'video'],
    default: 'text'
  },
  fileUrl: {
    type: String,
    default: null
  },
  fileName: {
    type: String,
    default: null
  },
  fileSize: {
    type: Number,
    default: null
  },
  fileType: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });

// Virtual populate for reply message
messageSchema.virtual('replyMessage', {
  ref: 'Message',
  localField: 'replyTo',
  foreignField: '_id',
  justOne: true
});

// Method to mark message as read
messageSchema.methods.markAsRead = async function(userId) {
  if (!this.readBy.includes(userId)) {
    this.readBy.push(userId);
    this.status = 'read';
    await this.save();
  }
};

// Method to edit message
messageSchema.methods.edit = async function(newContent) {
  this.content = newContent;
  this.isEdited = true;
  this.editedAt = new Date();
  await this.save();
};

// Method to delete message
messageSchema.methods.delete = async function(userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  await this.save();
};

// Static method to get messages for a conversation with pagination
messageSchema.statics.getMessages = async function(conversationId, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  return this.find({
    conversationId,
    isDeleted: false
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', 'username avatar')
    .populate('replyMessage')
    .lean();
};

// Static method to search messages
messageSchema.statics.searchMessages = async function(conversationId, searchQuery) {
  return this.find({
    conversationId,
    content: { $regex: searchQuery, $options: 'i' },
    isDeleted: false
  })
    .sort({ createdAt: -1 })
    .populate('sender', 'username avatar')
    .lean();
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message; 