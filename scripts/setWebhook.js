// Usage: fill .env (BOT_TOKEN, WEBHOOK_URL) then: `node scripts/setWebhook.js`
require("dotenv").config();

const { BOT_TOKEN, WEBHOOK_URL, TELEGRAM_SECRET_TOKEN } = process.env;

if (!BOT_TOKEN || !WEBHOOK_URL) {
  console.error("BOT_TOKEN va WEBHOOK_URL .env da bo'lishi kerak.");
  process.exit(1);
}

const url = new URL(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`);
url.searchParams.set("url", WEBHOOK_URL);

(async () => {
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: TELEGRAM_SECRET_TOKEN ? { "X-Telegram-Bot-Api-Secret-Token": TELEGRAM_SECRET_TOKEN } : {}
  });
  const json = await res.json();
  console.log(json);
})();