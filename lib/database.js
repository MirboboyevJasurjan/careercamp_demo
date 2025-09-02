const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
  userId: { type: Number, required: true, unique: true },
  username: String,
  firstName: String,
  lastName: String,
  applicationStatus: { 
    type: String, 
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Message Schema
const messageSchema = new mongoose.Schema({
  messageId: String,
  userId: Number,
  content: String,
  mediaType: String, // 'text', 'photo', 'audio', 'document', 'video', etc.
  mediaFileId: String,
  fileName: String,
  fileSize: Number,
  isFromAdmin: { type: Boolean, default: false },
  groupMessageId: Number,
  topicId: Number,
  replyToMessageId: String,
  createdAt: { type: Date, default: Date.now }
});

// Application Schema
const applicationSchema = new mongoose.Schema({
  userId: { type: Number, required: true },
  files: [{
    fileId: String,
    fileName: String,
    fileSize: Number,
    mediaType: String
  }],
  status: { 
    type: String, 
    enum: ['submitted', 'approved', 'rejected'],
    default: 'submitted'
  },
  submittedAt: { type: Date, default: Date.now },
  processedAt: Date,
  adminNote: String
});

const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);
const Application = mongoose.model('Application', applicationSchema);

// Connection management
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

module.exports = {
  connectDB,
  User,
  Message,
  Application
};