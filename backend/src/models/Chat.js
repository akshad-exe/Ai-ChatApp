const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  isGroupChat: {
    type: Boolean,
    default: false
  },
  groupName: {
    type: String,
    default: null
  },
  groupAvatar: {
    type: String,
    default: null
  },
  groupAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  lastMessageTime: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
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
chatSchema.index({ participants: 1 });
chatSchema.index({ lastMessageTime: -1 });

// Virtual populate for messages
chatSchema.virtual('messages', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'conversationId'
});

// Method to get chat participants
chatSchema.methods.getParticipants = async function() {
  return this.populate('participants', 'username avatar status');
};

// Method to update last message
chatSchema.methods.updateLastMessage = async function(messageId) {
  this.lastMessage = messageId;
  this.lastMessageTime = new Date();
  await this.save();
};

// Static method to find or create chat between two users
chatSchema.statics.findOrCreateChat = async function(user1Id, user2Id) {
  let chat = await this.findOne({
    participants: { $all: [user1Id, user2Id] },
    isGroupChat: false
  }).populate('participants', 'username avatar');

  if (!chat) {
    chat = await this.create({
      participants: [user1Id, user2Id],
      isGroupChat: false
    });
    chat = await chat.populate('participants', 'username avatar');
  }

  return chat;
};

// Static method to create group chat
chatSchema.statics.createGroupChat = async function(participants, groupName, groupAdmin) {
  const chat = await this.create({
    participants,
    isGroupChat: true,
    groupName,
    groupAdmin
  });
  return chat.populate('participants', 'username avatar');
};

// Static method to get user's chats
chatSchema.statics.getUserChats = async function(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  return this.find({
    participants: userId,
    isActive: true
  })
    .sort({ lastMessageTime: -1 })
    .skip(skip)
    .limit(limit)
    .populate('participants', 'username avatar')
    .populate('lastMessage')
    .lean();
};

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;