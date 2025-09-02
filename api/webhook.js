const StudentRegistrationBot = require('../lib/bot');

// Initialize bot instance
let botInstance = null;

// Initialize bot if not already done
const initBot = async () => {
  if (!botInstance) {
    botInstance = new StudentRegistrationBot();
    await botInstance.init();
  }
  return botInstance;
};

// Main webhook handler
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Only accept POST requests for webhook
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Validate request body
    if (!req.body) {
      return res.status(400).json({ error: 'No body provided' });
    }

    // Initialize bot
    const bot = await initBot();

    // Log incoming update for debugging
    console.log('Webhook received:', JSON.stringify(req.body, null, 2));

    // Process the update
    await bot.processUpdate(req.body);

    // Respond with success
    res.status(200).json({ ok: true });

  } catch (error) {
    console.error('Webhook error:', error);
    
    // Don't expose internal errors to Telegram
    res.status(200).json({ ok: false });
  }
}

// Handle webhook setup (for development/setup purposes)
export async function GET(req, res) {
  try {
    const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
    const action = searchParams.get('action');

    const bot = await initBot();

    if (action === 'setWebhook') {
      const webhookUrl = process.env.WEBHOOK_URL;
      if (!webhookUrl) {
        return res.status(400).json({ error: 'WEBHOOK_URL not configured' });
      }
      
      await bot.setWebhook(webhookUrl);
      return res.status(200).json({ message: 'Webhook set successfully', url: webhookUrl });
    }

    if (action === 'deleteWebhook') {
      await bot.deleteWebhook();
      return res.status(200).json({ message: 'Webhook deleted successfully' });
    }

    if (action === 'getWebhookInfo') {
      const botInstance = bot.getBot();
      const info = await botInstance.getWebHookInfo();
      return res.status(200).json(info);
    }

    if (action === 'getMe') {
      const botInstance = bot.getBot();
      const info = await botInstance.getMe();
      return res.status(200).json(info);
    }

    return res.status(200).json({ 
      message: 'Telegram Bot API Endpoint',
      availableActions: ['setWebhook', 'deleteWebhook', 'getWebhookInfo', 'getMe']
    });

  } catch (error) {
    console.error('GET endpoint error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Export for Vercel serverless function
module.exports = handler;