// test-env.js nomli fayl yarating
console.log('Before dotenv config');
require('dotenv').config();
console.log('After dotenv config');
console.log('All env vars:', Object.keys(process.env).filter(k => k.startsWith('BOT')));
console.log('BOT_TOKEN:', process.env.BOT_TOKEN);
console.log('MONGODB_URI:', process.env.MONGODB_URI);