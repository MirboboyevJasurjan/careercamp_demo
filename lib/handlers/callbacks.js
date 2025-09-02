const { User, Application } = require('../database');
const { CALLBACK_DATA, MESSAGES, APPLICATION_STATUS } = require('../utils/constants');
const { mainMenuKeyboard, cancelKeyboard } = require('../utils/keyboards');
const { setUserState, clearUserState, getUserApplicationFiles } = require('./messages');
const { createAdminMessage } = require('../utils/helpers');

const handleCallbackQuery = async (bot, callbackQuery) => {
  try {
    const { data, message, from } = callbackQuery;
    const chatId = message.chat.id;
    const userId = from.id;

    // Answer callback query to remove loading state
    await bot.answerCallbackQuery(callbackQuery.id);

    // Get user from database
    const user = await User.findOne({ userId });
    if (!user) {
      await bot.sendMessage(chatId, 'Please start the bot first with /start');
      return;
    }

    switch (data) {
      case CALLBACK_DATA.MESSAGE_ADMIN:
        await handleMessageAdmin(bot, chatId, userId);
        break;

      case CALLBACK_DATA.APPLY:
        await handleApply(bot, chatId, user);
        break;

      case CALLBACK_DATA.SUBMIT_APPLICATION:
        await handleSubmitApplication(bot, chatId, user);
        break;

      case CALLBACK_DATA.CANCEL:
        await handleCancel(bot, chatId, userId);
        break;

      case 'back_to_menu':
        await handleBackToMenu(bot, chatId, userId);
        break;

      default:
        await bot.sendMessage(chatId, MESSAGES.INVALID_COMMAND);
    }

  } catch (error) {
    console.error('Error handling callback query:', error);
    await bot.sendMessage(callbackQuery.message.chat.id, MESSAGES.ERROR);
  }
};

const handleMessageAdmin = async (bot, chatId, userId) => {
  try {
    setUserState(userId, 'messaging_admin');
    
    await bot.sendMessage(chatId, MESSAGES.MESSAGE_ADMIN_PROMPT, {
      reply_markup: cancelKeyboard
    });
  } catch (error) {
    console.error('Error in handleMessageAdmin:', error);
    throw error;
  }
};

const handleApply = async (bot, chatId, user) => {
  try {
    // Check if user already has a pending/approved application
    if (user.applicationStatus === APPLICATION_STATUS.PENDING) {
      await bot.sendMessage(chatId, MESSAGES.ALREADY_APPLIED, {
        reply_markup: mainMenuKeyboard
      });
      return;
    }

    if (user.applicationStatus === APPLICATION_STATUS.APPROVED) {
      // User is approved, can submit documents
      setUserState(user.userId, 'submitting_application');
      await bot.sendMessage(chatId, MESSAGES.APPLICATION_APPROVED, {
        reply_markup: cancelKeyboard
      });
      return;
    }

    // New application - set status to pending and prompt for documents
    await User.findOneAndUpdate(
      { userId: user.userId },
      { applicationStatus: APPLICATION_STATUS.PENDING }
    );

    setUserState(user.userId, 'submitting_application');
    await bot.sendMessage(chatId, MESSAGES.APPLY_PROMPT, {
      reply_markup: cancelKeyboard
    });

  } catch (error) {
    console.error('Error in handleApply:', error);
    throw error;
  }
};

const handleSubmitApplication = async (bot, chatId, user) => {
  try {
    const files = getUserApplicationFiles(user.userId);
    
    if (!files || files.length === 0) {
      await bot.sendMessage(chatId, 'Please send at least one file before submitting.');
      return;
    }

    // Create application in database
    const application = new Application({
      userId: user.userId,
      files: files,
      status: 'submitted'
    });
    
    await application.save();

    // Send application to admin group in applications topic
    let adminMessage = `📋 NEW APPLICATION\n\n`;
    adminMessage += `👤 User: ${user.firstName} ${user.lastName || ''}\n`;
    adminMessage += `🆔 ID: ${user.userId}\n`;
    adminMessage += `📁 Files submitted: ${files.length}\n\n`;
    
    files.forEach((file, index) => {
      adminMessage += `${index + 1}. ${file.fileName} (${(file.fileSize / 1024 / 1024).toFixed(2)} MB)\n`;
    });

    // Send text message first
    const appMessage = await bot.sendMessage(
      process.env.ADMIN_GROUP_ID,
      adminMessage,
      {
        message_thread_id: parseInt(process.env.APPLICATION_TOPIC_ID)
      }
    );

    // Send all files
    for (const file of files) {
      try {
        switch (file.mediaType) {
          case 'photo':
            await bot.sendPhoto(
              process.env.ADMIN_GROUP_ID,
              file.fileId,
              {
                message_thread_id: parseInt(process.env.APPLICATION_TOPIC_ID),
                reply_to_message_id: appMessage.message_id
              }
            );
            break;
          case 'document':
            await bot.sendDocument(
              process.env.ADMIN_GROUP_ID,
              file.fileId,
              {
                message_thread_id: parseInt(process.env.APPLICATION_TOPIC_ID),
                reply_to_message_id: appMessage.message_id
              }
            );
            break;
          case 'video':
            await bot.sendVideo(
              process.env.ADMIN_GROUP_ID,
              file.fileId,
              {
                message_thread_id: parseInt(process.env.APPLICATION_TOPIC_ID),
                reply_to_message_id: appMessage.message_id
              }
            );
            break;
          case 'audio':
            await bot.sendAudio(
              process.env.ADMIN_GROUP_ID,
              file.fileId,
              {
                message_thread_id: parseInt(process.env.APPLICATION_TOPIC_ID),
                reply_to_message_id: appMessage.message_id
              }
            );
            break;
          default:
            await bot.sendDocument(
              process.env.ADMIN_GROUP_ID,
              file.fileId,
              {
                message_thread_id: parseInt(process.env.APPLICATION_TOPIC_ID),
                reply_to_message_id: appMessage.message_id
              }
            );
        }
      } catch (fileError) {
        console.error(`Error sending file ${file.fileName}:`, fileError);
      }
    }

    // Clear user state and files
    clearUserState(user.userId);

    // Confirm to user
    await bot.sendMessage(chatId, MESSAGES.APPLICATION_RECEIVED, {
      reply_markup: mainMenuKeyboard
    });

  } catch (error) {
    console.error('Error in handleSubmitApplication:', error);
    throw error;
  }
};

const handleCancel = async (bot, chatId, userId) => {
  try {
    clearUserState(userId);
    
    await bot.sendMessage(chatId, '❌ Operation cancelled.', {
      reply_markup: mainMenuKeyboard
    });
  } catch (error) {
    console.error('Error in handleCancel:', error);
    throw error;
  }
};

const handleBackToMenu = async (bot, chatId, userId) => {
  try {
    clearUserState(userId);
    
    await bot.sendMessage(chatId, MESSAGES.WELCOME, {
      reply_markup: mainMenuKeyboard
    });
  } catch (error) {
    console.error('Error in handleBackToMenu:', error);
    throw error;
  }
};

module.exports = { handleCallbackQuery };