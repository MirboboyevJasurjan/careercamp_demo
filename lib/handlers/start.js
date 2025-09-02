const { User } = require('../database');
const { MESSAGES } = require('../utils/constants');
const { mainMenuKeyboard } = require('../utils/keyboards');

const handleStart = async (bot, msg) => {
  try {
    const chatId = msg.chat.id;
    const user = msg.from;

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

    // Send welcome message with main menu
    await bot.sendMessage(chatId, MESSAGES.WELCOME, {
      reply_markup: mainMenuKeyboard
    });

  } catch (error) {
    console.error('Error in start handler:', error);
    await bot.sendMessage(msg.chat.id, MESSAGES.ERROR);
  }
};

module.exports = { handleStart };