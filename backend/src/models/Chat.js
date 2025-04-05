const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastMessageTime: {
    type: Date,
    default: Date.now
  },
  isGroupChat: {
    type: Boolean,
    default: false
  },
  groupName: {
    type: String,
    trim: true
  },
  groupAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  unreadCounts: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    count: {
      type: Number,
      default: 0
    }
  }],
  settings: {
    notifications: {
      type: Boolean,
      default: true
    },
    encryption: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Index for faster queries
chatSchema.index({ participants: 1 });
chatSchema.index({ lastMessageTime: -1 });

// Method to get chat with populated fields
chatSchema.methods.getChatDetails = async function() {
  return this.populate([
    { path: 'participants', select: 'username email avatar isOnline lastSeen' },
    { path: 'lastMessage' },
    { path: 'groupAdmin', select: 'username email avatar' }
  ]);
};

// Static method to find or create a chat between two users
chatSchema.statics.findOrCreateChat = async function(user1Id, user2Id) {
  let chat = await this.findOne({
    participants: { $all: [user1Id, user2Id] },
    isGroupChat: false
  }).populate('participants', 'username email avatar isOnline lastSeen');

  if (!chat) {
    chat = await this.create({
      participants: [user1Id, user2Id],
      isGroupChat: false
    });
    chat = await chat.getChatDetails();
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