// server-local.js
require("dotenv").config();
const { bot, ensureBotInit } = require("./src/bot");

(async () => {
  try {
    await ensureBotInit();
    console.log("✅ Bot init — long polling rejimida ishlayapti (local test)");
    await bot.start();
  } catch (e) {
    console.error("❌ Xato: ", e);
    process.exit(1);
  }
})();

