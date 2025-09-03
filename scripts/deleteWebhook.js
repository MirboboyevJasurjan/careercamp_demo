// Usage: fill .env (BOT_TOKEN) then: `node scripts/deleteWebhook.js`
require("dotenv").config();

const { BOT_TOKEN } = process.env;

if (!BOT_TOKEN) {
  console.error("BOT_TOKEN .env da bo'lishi kerak.");
  process.exit(1);
}

const url = `https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`;

(async () => {
  const res = await fetch(url, { method: "GET" });
  const json = await res.json();
  console.log(json);
})();
