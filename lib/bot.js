const TelegramBot = require('node-telegram-bot-api');
const { connectDB } = require('./database');
const { handleStart } = require('./handlers/start');
const { handleMessage } = require('./handlers/messages');
const { handleCallbackQuery } = require('./handlers/callbacks');
const { COMMANDS } = require('./utils/constants');

class StudentRegistrationBot {
  constructor() {
    this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
  }

  // Initialize bot with webhook
  async init() {
    try {
      // Connect to database
      await connectDB();
      console.log('Bot initialized successfully');
    } catch (error) {
      console.error('Error initializing bot:', error);
      throw error;
    }
  }

  // Process webhook update
  async processUpdate(update) {
    try {
      // Handle different types of updates
      if (update.message) {
        await this.handleMessage(update.message);
      } else if (update.callback_query) {
        await this.handleCallbackQuery(update.callback_query);
      } else if (update.edited_message) {
        // Handle edited messages if needed
        console.log('Edited message received:', update.edited_message);
      }
    } catch (error) {
      console.error('Error processing update:', error);
    }
  }

  // Handle incoming messages
  async handleMessage(msg) {
    try {
      console.log('Received message:', {
        from: msg.from.username,
        chat: msg.chat.id,
        text: msg.text || '[media]'
      });

      // Handle commands
      if (msg.text && msg.text.startsWith('/')) {
        await this.handleCommand(msg);
        return;
      }

      // Handle regular messages
      await handleMessage(this.bot, msg);
    } catch (error) {
      console.error('Error in handleMessage:', error);
    }
  }

  // Handle commands
  async handleCommand(msg) {
    const command = msg.text.split(' ')[0];
    
    switch (command) {
      case COMMANDS.START:
        await handleStart(this.bot, msg);
        break;
      default:
        await this.bot.sendMessage(msg.chat.id, 'Unknown command. Use /start to begin.');
    }
  }

  // Handle callback queries
  async handleCallbackQuery(callbackQuery) {
    try {
      console.log('Received callback query:', {
        from: callbackQuery.from.username,
        data: callbackQuery.data
      });

      await handleCallbackQuery(this.bot, callbackQuery);
    } catch (error) {
      console.error('Error in handleCallbackQuery:', error);
    }
  }

  // Set webhook
  async setWebhook(url) {
    try {
      await this.bot.setWebHook(`${url}/api/webhook`);
      console.log('Webhook set successfully');
    } catch (error) {
      console.error('Error setting webhook:', error);
      throw error;
    }
  }

  // Delete webhook (for development)
  async deleteWebhook() {
    try {
      await this.bot.deleteWebHook();
      console.log('Webhook deleted successfully');
    } catch (error) {
      console.error('Error deleting webhook:', error);
    }
  }

  // Get bot instance for direct access
  getBot() {
    return this.bot;
  }
}

module.exports = StudentRegistrationBot;