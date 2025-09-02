const { Bot, InputFile, InlineKeyboard } = require("grammy");
const mongoose = require('mongoose');

// === ENV ===
if (!process.env.BOT_TOKEN) throw new Error("BOT_TOKEN env missing");
const bot = new Bot(process.env.BOT_TOKEN);

const ADMIN_GROUP_ID = Number(process.env.ADMIN_GROUP_ID);
const MESSAGE_TOPIC_ID = process.env.MESSAGE_TOPIC_ID ? Number(process.env.MESSAGE_TOPIC_ID) : undefined;
const APPLICATION_TOPIC_ID = process.env.APPLICATION_TOPIC_ID ? Number(process.env.APPLICATION_TOPIC_ID) : undefined;

if (!ADMIN_GROUP_ID) {
  throw new Error("❌ ADMIN_GROUP_ID is missing or invalid");
}

// === Database Models ===
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

const messageSchema = new mongoose.Schema({
  messageId: String,
  userId: Number,
  content: String,
  mediaType: String,
  mediaFileId: String,
  fileName: String,
  fileSize: Number,
  isFromAdmin: { type: Boolean, default: false },
  groupMessageId: Number,
  topicId: Number,
  replyToMessageId: String,
  createdAt: { type: Date, default: Date.now }
});

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

// === Database Connection ===
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  
  try {
await mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://mirboboyevjasur017_db_user:JpcE0bBTFi7BdAd5@cluster.mongodb.net/telegram_bot") ;
    isConnected = true;
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

// === Constants ===
const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB

const MESSAGES = {
  WELCOME: '👋 Welcome to the Student Club Registration Bot!\n\nChoose an option below:',
  MESSAGE_ADMIN_PROMPT: '📝 You can now send your message to admin. You can send:\n• Text messages\n• Photos\n• Audio files\n• Documents\n• Videos\n\nSend your message now:',
  MESSAGE_SENT: '✅ Your message has been sent to admin!',
  APPLY_PROMPT: '📄 To apply for the club, please send your application documents.\n\n📋 Requirements:\n• Files must be under 30MB\n• You can send multiple files\n• Supported formats: PDF, DOC, DOCX, images\n\nSend your first document:',
  APPLICATION_RECEIVED: '✅ Your application has been received and is under review.\n\nYou will be notified once the admin reviews your application.',
  FILE_TOO_LARGE: '❌ File is too large! Please send files under 30MB.',
  APPLICATION_APPROVED: '🎉 Congratulations! Your application has been approved.\n\nYou can now submit your documents:',
  APPLICATION_REJECTED: '❌ Sorry, your application has been rejected.',
  ALREADY_APPLIED: '⏳ You have already submitted an application. Please wait for admin review.',
  INVALID_COMMAND: '❓ Invalid command. Please use /start to begin.',
  ERROR: '❌ An error occurred. Please try again later.'
};

// === In-Memory State ===
const userStates = new Map();
const applicationFiles = new Map();
const handledUpdates = new Map();

// === Helper Functions ===
const escapeHtml = (s = "") =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const makeUserInfo = (ctx) => {
  const u = ctx.from || {};
  const name = escapeHtml(u.first_name || "User");
  const uname = u.username ? `@${escapeHtml(u.username)}` : "(no username)";
  const linkU = `<a href="tg://user?id=${u.id}">${name}</a>`;
  return `👤 User: ${linkU} ${uname}\n🆔 ID: ${u.id}`;
};

const getFileInfo = (ctx) => {
  const msg = ctx.message || ctx.msg;
  
  if (msg.photo) {
    const photo = msg.photo[msg.photo.length - 1];
    return {
      mediaType: 'photo',
      fileId: photo.file_id,
      fileSize: photo.file_size,
      fileName: `photo_${Date.now()}.jpg`
    };
  }

  if (msg.audio) {
    return {
      mediaType: 'audio',
      fileId: msg.audio.file_id,
      fileSize: msg.audio.file_size,
      fileName: msg.audio.file_name || `audio_${Date.now()}.mp3`
    };
  }

  if (msg.voice) {
    return {
      mediaType: 'voice',
      fileId: msg.voice.file_id,
      fileSize: msg.voice.file_size,
      fileName: `voice_${Date.now()}.ogg`
    };
  }

  if (msg.video) {
    return {
      mediaType: 'video',
      fileId: msg.video.file_id,
      fileSize: msg.video.file_size,
      fileName: msg.video.file_name || `video_${Date.now()}.mp4`
    };
  }

  if (msg.document) {
    return {
      mediaType: 'document',
      fileId: msg.document.file_id,
      fileSize: msg.document.file_size,
      fileName: msg.document.file_name || `document_${Date.now()}`
    };
  }

  if (msg.video_note) {
    return {
      mediaType: 'video_note',
      fileId: msg.video_note.file_id,
      fileSize: msg.video_note.file_size,
      fileName: `video_note_${Date.now()}.mp4`
    };
  }

  return null;
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const createAdminMessage = (user, content, fileInfo = null) => {
  let message = `${makeUserInfo({ from: user })}\n\n`;
  
  if (content) {
    message += `💬 Message: ${escapeHtml(content)}\n`;
  }
  
  if (fileInfo) {
    message += `📎 File: ${fileInfo.fileName}\n`;
    message += `📊 Size: ${formatFileSize(fileInfo.fileSize)}\n`;
    message += `🗂 Type: ${fileInfo.mediaType.toUpperCase()}`;
  }
  
  return message;
};

// === Keyboards ===
const mainMenuKeyboard = new InlineKeyboard()
  .text('💬 Message Admin', 'message_admin')
  .text('📝 Apply', 'apply');

const cancelKeyboard = new InlineKeyboard()
  .text('❌ Cancel', 'cancel');

const submitApplicationKeyboard = new InlineKeyboard()
  .text('✅ Submit Application', 'submit_application')
  .row()
  .text('❌ Cancel', 'cancel');

const backToMenuKeyboard = new InlineKeyboard()
  .text('🏠 Back to Menu', 'back_to_menu');

// === Middleware: Duplicate Guard ===
bot.use(async (ctx, next) => {
  const updateId = ctx.update?.update_id;
  if (typeof updateId === "undefined") return next();
  
  if (handledUpdates.has(updateId)) {
    console.log("⏭️ Duplicate update:", updateId);
    return;
  }
  
  handledUpdates.set(updateId, Date.now());
  await next();
});

// === Database Middleware ===
bot.use(async (ctx, next) => {
  await connectDB();
  await next();
});

// === Commands ===
bot.command('start', async (ctx) => {
  try {
    const user = ctx.from;

    // Create or update user in database
    await User.findOneAndUpdate(
      { userId: user.id },
      {
        userId: user.id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Clear any existing state
    userStates.delete(user.id);
    applicationFiles.delete(user.id);

    // Send welcome message
    await ctx.reply(MESSAGES.WELCOME, {
      reply_markup: mainMenuKeyboard
    });

  } catch (error) {
    console.error('Error in start command:', error);
    await ctx.reply(MESSAGES.ERROR);
  }
});

// === Callback Query Handlers ===
bot.callbackQuery('message_admin', async (ctx) => {
  await ctx.answerCallbackQuery();
  
  try {
    userStates.set(ctx.from.id, 'messaging_admin');
    
    await ctx.reply(MESSAGES.MESSAGE_ADMIN_PROMPT, {
      reply_markup: cancelKeyboard
    });
  } catch (error) {
    console.error('Error in message_admin callback:', error);
    await ctx.reply(MESSAGES.ERROR);
  }
});

bot.callbackQuery('apply', async (ctx) => {
  await ctx.answerCallbackQuery();
  
  try {
    const user = await User.findOne({ userId: ctx.from.id });
    if (!user) {
      await ctx.reply('Please start the bot first with /start');
      return;
    }

    // Check if user already has a pending/approved application
    if (user.applicationStatus === 'pending') {
      await ctx.reply(MESSAGES.ALREADY_APPLIED, {
        reply_markup: mainMenuKeyboard
      });
      return;
    }

    if (user.applicationStatus === 'approved') {
      // User is approved, can submit documents
      userStates.set(ctx.from.id, 'submitting_application');
      await ctx.reply(MESSAGES.APPLICATION_APPROVED, {
        reply_markup: cancelKeyboard
      });
      return;
    }

    // New application - set status to pending and prompt for documents
    await User.findOneAndUpdate(
      { userId: ctx.from.id },
      { applicationStatus: 'pending' }
    );

    userStates.set(ctx.from.id, 'submitting_application');
    await ctx.reply(MESSAGES.APPLY_PROMPT, {
      reply_markup: cancelKeyboard
    });

  } catch (error) {
    console.error('Error in apply callback:', error);
    await ctx.reply(MESSAGES.ERROR);
  }
});

bot.callbackQuery('submit_application', async (ctx) => {
  await ctx.answerCallbackQuery();
  
  try {
    const files = applicationFiles.get(ctx.from.id) || [];
    
    if (files.length === 0) {
      await ctx.reply('Please send at least one file before submitting.');
      return;
    }

    const user = await User.findOne({ userId: ctx.from.id });
    
    // Create application in database
    const application = new Application({
      userId: ctx.from.id,
      files: files,
      status: 'submitted'
    });
    
    await application.save();

    // Send application to admin group in applications topic
    let adminMessage = `📋 NEW APPLICATION\n\n`;
    adminMessage += `👤 User: ${user.firstName} ${user.lastName || ''}\n`;
    adminMessage += `🆔 ID: ${ctx.from.id}\n`;
    adminMessage += `📁 Files submitted: ${files.length}\n\n`;
    
    files.forEach((file, index) => {
      adminMessage += `${index + 1}. ${file.fileName} (${(file.fileSize / 1024 / 1024).toFixed(2)} MB)\n`;
    });

    // Send text message first
    const appMessage = await bot.api.sendMessage(
      ADMIN_GROUP_ID,
      adminMessage,
      {
        message_thread_id: APPLICATION_TOPIC_ID,
        parse_mode: "HTML"
      }
    );

    // Send all files
    for (const file of files) {
      try {
        const options = {
          message_thread_id: APPLICATION_TOPIC_ID,
          reply_to_message_id: appMessage.message_id
        };

        switch (file.mediaType) {
          case 'photo':
            await bot.api.sendPhoto(ADMIN_GROUP_ID, file.fileId, options);
            break;
          case 'document':
            await bot.api.sendDocument(ADMIN_GROUP_ID, file.fileId, options);
            break;
          case 'video':
            await bot.api.sendVideo(ADMIN_GROUP_ID, file.fileId, options);
            break;
          case 'audio':
            await bot.api.sendAudio(ADMIN_GROUP_ID, file.fileId, options);
            break;
          case 'voice':
            await bot.api.sendVoice(ADMIN_GROUP_ID, file.fileId, options);
            break;
          default:
            await bot.api.sendDocument(ADMIN_GROUP_ID, file.fileId, options);
        }
      } catch (fileError) {
        console.error(`Error sending file ${file.fileName}:`, fileError);
      }
    }

    // Clear user state and files
    userStates.delete(ctx.from.id);
    applicationFiles.delete(ctx.from.id);

    // Confirm to user
    await ctx.reply(MESSAGES.APPLICATION_RECEIVED, {
      reply_markup: mainMenuKeyboard
    });

  } catch (error) {
    console.error('Error in submit_application callback:', error);
    await ctx.reply(MESSAGES.ERROR);
  }
});

bot.callbackQuery('cancel', async (ctx) => {
  await ctx.answerCallbackQuery();
  
  try {
    userStates.delete(ctx.from.id);
    applicationFiles.delete(ctx.from.id);
    
    await ctx.reply('❌ Operation cancelled.', {
      reply_markup: mainMenuKeyboard
    });
  } catch (error) {
    console.error('Error in cancel callback:', error);
    await ctx.reply(MESSAGES.ERROR);
  }
});

bot.callbackQuery('back_to_menu', async (ctx) => {
  await ctx.answerCallbackQuery();
  
  try {
    userStates.delete(ctx.from.id);
    applicationFiles.delete(ctx.from.id);
    
    await ctx.reply(MESSAGES.WELCOME, {
      reply_markup: mainMenuKeyboard
    });
  } catch (error) {
    console.error('Error in back_to_menu callback:', error);
    await ctx.reply(MESSAGES.ERROR);
  }
});

// === Message Handlers ===
bot.on('message', async (ctx) => {
  try {
    const userId = ctx.from.id;
    const chatId = ctx.chat.id;
    const userState = userStates.get(userId);

    // Handle messages from admin group
    if (chatId === ADMIN_GROUP_ID) {
      await handleAdminReply(ctx);
      return;
    }

    // Get user from database
    const user = await User.findOne({ userId });
    if (!user) {
      await ctx.reply('Please start the bot first with /start');
      return;
    }

    // Handle different user states
    if (userState === 'messaging_admin') {
      await handleMessageToAdmin(ctx, user);
    } else if (userState === 'submitting_application') {
      await handleApplicationSubmission(ctx, user);
    } else {
      // No active state - redirect to start
      await ctx.reply('Please use /start to access the bot menu');
    }

  } catch (error) {
    console.error('Error handling message:', error);
    await ctx.reply(MESSAGES.ERROR);
  }
});

// === Message Handler Functions ===
const handleMessageToAdmin = async (ctx, user) => {
  try {
    const fileInfo = getFileInfo(ctx);
    const content = ctx.message.text || ctx.message.caption || '';

    // Create admin message
    const adminMessage = createAdminMessage(user, content, fileInfo);

    let sentMessage;
    
    // Send to admin group in messages topic
    const options = {
      message_thread_id: MESSAGE_TOPIC_ID,
      parse_mode: "HTML"
    };

    if (fileInfo) {
      // Send media with caption
      switch (fileInfo.mediaType) {
        case 'photo':
          sentMessage = await ctx.api.sendPhoto(
            ADMIN_GROUP_ID,
            fileInfo.fileId,
            { ...options, caption: adminMessage }
          );
          break;
        case 'audio':
          sentMessage = await ctx.api.sendAudio(
            ADMIN_GROUP_ID,
            fileInfo.fileId,
            { ...options, caption: adminMessage }
          );
          break;
        case 'video':
          sentMessage = await ctx.api.sendVideo(
            ADMIN_GROUP_ID,
            fileInfo.fileId,
            { ...options, caption: adminMessage }
          );
          break;
        case 'document':
          sentMessage = await ctx.api.sendDocument(
            ADMIN_GROUP_ID,
            fileInfo.fileId,
            { ...options, caption: adminMessage }
          );
          break;
        case 'voice':
          sentMessage = await ctx.api.sendVoice(
            ADMIN_GROUP_ID,
            fileInfo.fileId,
            { ...options, caption: adminMessage }
          );
          break;
        default:
          sentMessage = await ctx.api.sendMessage(
            ADMIN_GROUP_ID,
            adminMessage,
            options
          );
      }
    } else {
      // Send text message
      sentMessage = await ctx.api.sendMessage(
        ADMIN_GROUP_ID,
        adminMessage,
        options
      );
    }

    // Save message to database
    await new Message({
      messageId: `${user.userId}_${Date.now()}`,
      userId: user.userId,
      content,
      mediaType: fileInfo?.mediaType || 'text',
      mediaFileId: fileInfo?.fileId,
      fileName: fileInfo?.fileName,
      fileSize: fileInfo?.fileSize,
      groupMessageId: sentMessage.message_id,
      topicId: MESSAGE_TOPIC_ID,
      isFromAdmin: false
    }).save();

    // Clear user state
    userStates.delete(user.userId);

    // Confirm message sent
    await ctx.reply(MESSAGES.MESSAGE_SENT, {
      reply_markup: backToMenuKeyboard
    });

  } catch (error) {
    console.error('Error sending message to admin:', error);
    await ctx.reply(MESSAGES.ERROR);
  }
};

const handleApplicationSubmission = async (ctx, user) => {
  try {
    const fileInfo = getFileInfo(ctx);
    
    if (!fileInfo) {
      await ctx.reply('Please send a file for your application.');
      return;
    }

    // Check file size
    if (fileInfo.fileSize > MAX_FILE_SIZE) {
      await ctx.reply(MESSAGES.FILE_TOO_LARGE);
      return;
    }

    // Add file to user's application
    if (!applicationFiles.has(user.userId)) {
      applicationFiles.set(user.userId, []);
    }
    
    applicationFiles.get(user.userId).push(fileInfo);

    await ctx.reply(
      `✅ File "${fileInfo.fileName}" added to your application.\n\nYou can send more files or submit your application.`,
      {
        reply_markup: submitApplicationKeyboard
      }
    );

  } catch (error) {
    console.error('Error handling application file:', error);
    await ctx.reply(MESSAGES.ERROR);
  }
};

const handleAdminReply = async (ctx) => {
  try {
    if (!ctx.message.reply_to_message) return;

    // Extract user ID from admin reply
    const match = ctx.message.reply_to_message.text?.match(/🆔 ID: (\d+)/);
    if (!match) return;
    
    const userId = parseInt(match[1]);
    const user = await User.findOne({ userId });
    if (!user) return;

    // Forward admin's reply to user
    const replyText = `📨 Reply from admin:\n\n${ctx.message.text}`;
    await ctx.api.sendMessage(userId, replyText);

    // Save admin message to database
    await new Message({
      messageId: `admin_${Date.now()}`,
      userId: userId,
      content: ctx.message.text,
      mediaType: 'text',
      isFromAdmin: true,
      groupMessageId: ctx.message.message_id,
      topicId: MESSAGE_TOPIC_ID
    }).save();

  } catch (error) {
    console.error('Error handling admin reply:', error);
  }
};

// === Error Handler ===
bot.catch((e) => console.error("❗️ Bot error:", e));

// === Bot Initialization ===
let inited = false;
async function ensureBotInit() {
  if (!inited) {
    await connectDB();
    await bot.init();
    inited = true;
    console.log("✅ Bot initialized successfully");
  }
}

// === Cleanup ===
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
setInterval(() => {
  const now = Date.now();
  const TTL = 10 * 60 * 1000; // 10 minutes
  
  for (const [k, t] of handledUpdates.entries()) {
    if (now - t > TTL) handledUpdates.delete(k);
  }
}, CLEANUP_INTERVAL).unref?.();

module.exports = { bot, ensureBotInit };