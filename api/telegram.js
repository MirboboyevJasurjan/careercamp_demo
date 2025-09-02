const { webhookCallback } = require("grammy");
const { bot, ensureBotInit } = require("../bot");

// Webhook secret for security (optional)
const EXPECTED = (process.env.WEBHOOK_SECRET || "").trim();

module.exports = async function handler(req, res) {
  // Handle GET requests - health check
  if (req.method === "GET") {
    return res.status(200).json({ 
      ok: true, 
      bot: "student-registration-bot",
      status: "alive" 
    });
  }
  
  // Only accept POST requests for webhook
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Optional webhook secret verification
  if (EXPECTED) {
    const got = (req.headers["x-telegram-bot-api-secret-token"] || "").trim();
    if (got !== EXPECTED) {
      console.warn("❌ Webhook secret mismatch:", got || "EMPTY");
      return res.status(401).end("Unauthorized");
    }
  }

  try {
    // Ensure bot is initialized
    await ensureBotInit();

    // Use grammY's webhook callback
    const fn = webhookCallback(bot, "http");
    await fn(req, res);
    
  } catch (error) {
    console.error("❗️ Webhook error:", error);
    
    // Always return 200 to Telegram to avoid retries
    if (!res.headersSent) {
      res.status(200).json({ ok: false });
    }
  }
};