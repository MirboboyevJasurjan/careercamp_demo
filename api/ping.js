module.exports = async function handler(req, res) {
    const { method, query } = req;
    
    if (method === "GET") {
      const { action } = query;
      
      // Handle different actions
      switch (action) {
        case 'setWebhook':
          return res.status(200).json({
            message: "Use Telegram Bot API to set webhook",
            url: `https://api.telegram.org/bot${process.env.BOT_TOKEN}/setWebhook`,
            webhook_url: `${req.headers.host}/api/telegram`,
            note: "Set webhook manually via Telegram Bot API"
          });
          
        case 'deleteWebhook':
          return res.status(200).json({
            message: "Use Telegram Bot API to delete webhook",
            url: `https://api.telegram.org/bot${process.env.BOT_TOKEN}/deleteWebhook`
          });
          
        case 'getWebhookInfo':
          return res.status(200).json({
            message: "Use Telegram Bot API to get webhook info",
            url: `https://api.telegram.org/bot${process.env.BOT_TOKEN}/getWebhookInfo`
          });
          
        default:
          return res.status(200).json({
            message: "Student Registration Bot - Ping Endpoint",
            timestamp: new Date().toISOString(),
            status: "healthy",
            availableActions: ['setWebhook', 'deleteWebhook', 'getWebhookInfo']
          });
      }
    }
    
    return res.status(405).json({ error: "Method Not Allowed" });
  };