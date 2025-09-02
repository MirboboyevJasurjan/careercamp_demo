const { User, Message } = require('../database');
const { MESSAGES, MEDIA_TYPES, MAX_FILE_SIZE } = require('../utils/constants');
const { getFileInfo, isFromAdminGroup, extractUserIdFromReply, createAdminMessage } = require('../utils/helpers');
const { backToMenuKeyboard } = require('../utils/keyboards');

// In-memory state storage (in production, use Redis or database)
const userStates = new Map();
const applicationFiles = new Map();

const handleMessage = async (bot, msg) => {
  try {
    // Handle messages from admin group
    if (isFromAdminGroup(msg)) {
      await handleAdminReply(bot, msg);
      return;
    }

    // Handle user messages
    await handleUserMessage(bot, msg);
  } catch (error) {
    console.error('Error handling message:', error);
    await bot.sendMessage(msg.chat.id, MESSAGES.ERROR);
  }
};

const handleUserMessage = async (bot, msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const userState = userStates.get(userId);

  // Get user from database
  const user = await User.findOne({ userId });
  if (!user) {
    await bot.sendMessage(chatId, 'Please start the bot first with /start');
    return;
  }

  // Handle different user states
  if (userState === 'messaging_admin') {
    await handleMessageToAdmin(bot, msg, user);
  } else if (userState === 'submitting_application') {
    await handleApplicationSubmission(bot, msg, user);
  } else {
    // No active state - redirect to start
    await bot.sendMessage(chatId, 'Please use /start to access the bot menu');
  }
};

const handleMessageToAdmin = async (bot, msg, user) => {
  try {
    const fileInfo = getFileInfo(msg);
    const content = msg.text || msg.caption || '';

    // Create admin message
    const adminMessage = createAdminMessage(user, content, fileInfo);

    let sentMessage;
    
    // Send to admin group in messages topic
    if (fileInfo) {
      // Send media with caption
      switch (fileInfo.mediaType) {
        case MEDIA_TYPES.PHOTO:
          sentMessage = await bot.sendPhoto(
            process.env.ADMIN_GROUP_ID,
            fileInfo.fileId,
            {
              caption: adminMessage,
              message_thread_id: parseInt(process.env.MESSAGE_TOPIC_ID)
            }
          );
          break;
        case MEDIA_TYPES.AUDIO:
          sentMessage = await bot.sendAudio(
            process.env.ADMIN_GROUP_ID,
            fileInfo.fileId,
            {
              caption: adminMessage,
              message_thread_id: parseInt(process.env.MESSAGE_TOPIC_ID)
            }
          );
          break;
        case MEDIA_TYPES.VIDEO:
          sentMessage = await bot.sendVideo(
            process.env.ADMIN_GROUP_ID,
            fileInfo.fileId,
            {
              caption: adminMessage,
              message_thread_id: parseInt(process.env.MESSAGE_TOPIC_ID)
            }
          );
          break;
        case MEDIA_TYPES.DOCUMENT:
          sentMessage = await bot.sendDocument(
            process.env.ADMIN_GROUP_ID,
            fileInfo.fileId,
            {
              caption: adminMessage,
              message_thread_id: parseInt(process.env.MESSAGE_TOPIC_ID)
            }
          );
          break;
        case MEDIA_TYPES.VOICE:
          sentMessage = await bot.sendVoice(
            process.env.ADMIN_GROUP_ID,
            fileInfo.fileId,
            {
              caption: adminMessage,
              message_thread_id: parseInt(process.env.MESSAGE_TOPIC_ID)
            }
          );
          break;
        default:
          sentMessage = await bot.sendMessage(
            process.env.ADMIN_GROUP_ID,
            adminMessage,
            {
              message_thread_id: parseInt(process.env.MESSAGE_TOPIC_ID)
            }
          );
      }
    } else {
      // Send text message
      sentMessage = await bot.sendMessage(
        process.env.ADMIN_GROUP_ID,
        adminMessage,
        {
          message_thread_id: parseInt(process.env.MESSAGE_TOPIC_ID)
        }
      );
    }

    // Save message to database
    await new Message({
      messageId: `${user.userId}_${Date.now()}`,
      userId: user.userId,
      content,
      mediaType: fileInfo?.mediaType || MEDIA_TYPES.TEXT,
      mediaFileId: fileInfo?.fileId,
      fileName: fileInfo?.fileName,
      fileSize: fileInfo?.fileSize,
      groupMessageId: sentMessage.message_id,
      topicId: parseInt(process.env.MESSAGE_TOPIC_ID),
      isFromAdmin: false
    }).save();

    // Clear user state
    userStates.delete(user.userId);

    // Confirm message sent
    await bot.sendMessage(msg.chat.id, MESSAGES.MESSAGE_SENT, {
      reply_markup: backToMenuKeyboard
    });

  } catch (error) {
    console.error('Error sending message to admin:', error);
    await bot.sendMessage(msg.chat.id, MESSAGES.ERROR);
  }
};

const handleApplicationSubmission = async (bot, msg, user) => {
  try {
    const fileInfo = getFileInfo(msg);
    
    if (!fileInfo) {
      await bot.sendMessage(msg.chat.id, 'Please send a file for your application.');
      return;
    }

    // Check file size
    if (fileInfo.fileSize > MAX_FILE_SIZE) {
      await bot.sendMessage(msg.chat.id, MESSAGES.FILE_TOO_LARGE);
      return;
    }

    // Add file to user's application
    if (!applicationFiles.has(user.userId)) {
      applicationFiles.set(user.userId, []);
    }
    
    applicationFiles.get(user.userId).push(fileInfo);

    await bot.sendMessage(
      msg.chat.id,
      `✅ File "${fileInfo.fileName}" added to your application.\n\nYou can send more files or submit your application.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '✅ Submit Application', callback_data: 'submit_application' }],
            [{ text: '❌ Cancel', callback_data: 'cancel' }]
          ]
        }
      }
    );

  } catch (error) {
    console.error('Error handling application file:', error);
    await bot.sendMessage(msg.chat.id, MESSAGES.ERROR);
  }
};

const handleAdminReply = async (bot, msg) => {
  try {
    if (!msg.reply_to_message) return;

    const userId = extractUserIdFromReply(msg);
    if (!userId) return;

    const user = await User.findOne({ userId });
    if (!user) return;

    // Forward admin's reply to user
    const replyText = `📨 Reply from admin:\n\n${msg.text}`;
    await bot.sendMessage(userId, replyText);

    // Save admin message to database
    await new Message({
      messageId: `admin_${Date.now()}`,
      userId: userId,
      content: msg.text,
      mediaType: MEDIA_TYPES.TEXT,
      isFromAdmin: true,
      groupMessageId: msg.message_id,
      topicId: parseInt(process.env.MESSAGE_TOPIC_ID)
    }).save();

  } catch (error) {
    console.error('Error handling admin reply:', error);
  }
};

// Export state management functions
const setUserState = (userId, state) => {
  userStates.set(userId, state);
};

const getUserState = (userId) => {
  return userStates.get(userId);
};

const clearUserState = (userId) => {
  userStates.delete(userId);
  applicationFiles.delete(userId);
};

const getUserApplicationFiles = (userId) => {
  return applicationFiles.get(userId) || [];
};

module.exports = {
  handleMessage,
  setUserState,
  getUserState,
  clearUserState,
  getUserApplicationFiles
};