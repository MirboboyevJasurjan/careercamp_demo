const { webhookCallback } = require("grammy");
const { bot, ensureBotInit } = require("../src/bot");

// Telegram "secret token" ni tekshirish (ixtiyoriy lekin xavfsiz)
function checkSecret(req) {
  const required = process.env.TELEGRAM_SECRET_TOKEN;
  if (!required) return true; // yo'q bo'lsa o'tkazamiz
  const got = req.headers["x-telegram-bot-api-secret-token"];
  return got && got === required;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method Not Allowed" });
    return;
  }
  if (!checkSecret(req)) {
    res.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }

  try {
    await ensureBotInit();
    const handleUpdate = webhookCallback(bot, "http");
    await handleUpdate(req, res);
  } catch (e) {
    console.error("Webhook error:", e);
    res.status(500).json({ ok: false });
  }
};
