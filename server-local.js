// Local development server
require('dotenv').config({ path: './.env' });

const express = require('express');
const { bot, ensureBotInit } = require('./bot');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Student Registration Bot - Local Server',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Webhook endpoint for local testing
app.post('/webhook', async (req, res) => {
  try {
    await ensureBotInit();
    
    console.log('📨 Received update:', JSON.stringify(req.body, null, 2));
    
    // Process the update directly with grammY
    await bot.handleUpdate(req.body);
    
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('❗️ Webhook error:', error);
    res.status(200).json({ ok: false });
  }
});

// Start server
async function startServer() {
  try {
    await ensureBotInit();
    
    app.listen(PORT, () => {
      console.log(`🚀 Local server running on port ${PORT}`);
      console.log(`📱 Webhook endpoint: http://localhost:${PORT}/webhook`);
      console.log('💡 Use ngrok to expose this for Telegram webhook testing');
      console.log('   Example: ngrok http 3000');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down server...');
  process.exit(0);
});

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;