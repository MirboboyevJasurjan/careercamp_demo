const { webhookCallback } = require("grammy");
const { bot, ensureBotInit } = require("../src/bot");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  try {
    await ensureBotInit();
    const handleUpdate = webhookCallback(bot, "http");
    await handleUpdate(req, res);
  } catch (e) {
    console.error("Webhook error:", e);
    res.status(500).json({ ok: false });
  }
};