const mongoose = require("mongoose");

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI env yo'q. Vercel Environment Variables ga qo'yishingiz kerak.");

  await mongoose.connect(uri);
  isConnected = true;
  console.log("✅ MongoDB ulandi");
}

module.exports = { connectDB };
