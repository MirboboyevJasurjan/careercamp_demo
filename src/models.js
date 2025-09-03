const mongoose = require("mongoose");
const { Schema } = mongoose;

// User
const userSchema = new Schema({
  userId: { type: Number, required: true, unique: true, index: true },
  username: String,
  firstName: String,
  lastName: String,
  state: { type: String, enum: ["none", "messaging_admin", "collecting_application"], default: "none" },
  applicationStatus: { type: String, enum: ["none", "pending", "approved", "rejected"], default: "none" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Message logs (user ↔ admin)
const messageSchema = new Schema({
  userId: { type: Number, index: true },
  direction: { type: String, enum: ["to_admin", "to_user"], required: true },
  kind: { type: String, enum: ["message", "application"], default: "message" },
  content: String,
  mediaType: String,
  mediaFileId: String,
  fileName: String,
  fileSize: Number,
  groupMessageId: Number,
  replyToGroupMessageId: Number,
  topicId: Number,
  createdAt: { type: Date, default: Date.now }
});

// Application (final submitted)
const applicationSchema = new Schema({
  userId: { type: Number, required: true, index: true },
  files: [{
    fileId: String,
    fileName: String,
    fileSize: Number,
    mediaType: String
  }],
  status: { type: String, enum: ["submitted", "approved", "rejected"], default: "submitted" },
  submittedAt: { type: Date, default: Date.now },
  processedAt: Date,
  adminNote: String
});

// DraftApplication (stateless serverless uchun: fayllarni vaqtincha saqlash)
const draftApplicationSchema = new Schema({
  userId: { type: Number, required: true, unique: true, index: true },
  files: [{
    fileId: String,
    fileName: String,
    fileSize: Number,
    mediaType: String
  }],
  // TTL uchun alohida maydon
  expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), index: { expires: '24h' } }
});

// Admin guruhidagi post ↔ user mapping
const threadMapSchema = new Schema({
  groupMessageId: { type: Number, required: true, unique: true, index: true },
  userId: { type: Number, required: true, index: true },
  kind: { type: String, enum: ["message", "application"], default: "message" },
  applicationId: { type: Schema.Types.ObjectId, ref: "Application" },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);
const Message = mongoose.model("Message", messageSchema);
const Application = mongoose.model("Application", applicationSchema);
const DraftApplication = mongoose.model("DraftApplication", draftApplicationSchema);
const ThreadMap = mongoose.model("ThreadMap", threadMapSchema);

module.exports = { User, Message, Application, DraftApplication, ThreadMap };
