const { Bot } = require("grammy");
const { connectDB } = require("./db");
const { User, Message, Application, DraftApplication, ThreadMap } = require("./models");
const M = require("./messages");
const KB = require("./keyboards");
const { escapeHtml, formatFileSize, makeUserLink, getFileInfo, sendMedia } = require("./utils");

const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB

if (!process.env.BOT_TOKEN) throw new Error("BOT_TOKEN env yo'q");
if (!process.env.ADMIN_GROUP_ID) throw new Error("ADMIN_GROUP_ID env yo'q");

const ADMIN_GROUP_ID = Number(process.env.ADMIN_GROUP_ID);
const MESSAGE_TOPIC_ID = process.env.MESSAGE_TOPIC_ID ? Number(process.env.MESSAGE_TOPIC_ID) : undefined;
const APPLICATION_TOPIC_ID = process.env.APPLICATION_TOPIC_ID ? Number(process.env.APPLICATION_TOPIC_ID) : undefined;

const bot = new Bot(process.env.BOT_TOKEN);

async function ensureBotInit() {
  await connectDB();
  await bot.init();
}

// === Helpers ===
function adminThreadOptions(topicId) {
  const opt = {};
  if (topicId) opt.message_thread_id = topicId; // mavjud bo'lsa qo'shamiz, bo'lmasa yubormaymiz
  return opt;
}

function buildAdminCaptionFromUser(uFrom, text, file) {
  let s = `👤 Foydalanuvchi: ${makeUserLink(uFrom)} ${uFrom.username ? `@${escapeHtml(uFrom.username)}` : "(username yo'q)"}\n🆔 ID: ${uFrom.id}\n\n`;
  if (text) s += `💬 Xabar: ${escapeHtml(text)}\n`;
  if (file) {
    s += `📎 Fayl: ${escapeHtml(file.fileName)}\n`;
    s += `📊 Hajm: ${formatFileSize(file.fileSize)}\n`;
    s += `🗂 Tur: ${file.mediaType.toUpperCase()}`;
  }
  return s;
}

// === /start ===
bot.command("start", async (ctx) => {
  try {
    await connectDB();
    const f = ctx.from;
    await User.findOneAndUpdate(
      { userId: f.id },
      {
        userId: f.id,
        username: f.username,
        firstName: f.first_name,
        lastName: f.last_name,
        state: "none",
        updatedAt: new Date()
      },
      { upsert: true }
    );
    await ctx.reply(M.WELCOME, { reply_markup: KB.mainMenuKeyboard() });
  } catch (e) {
    console.error("start error:", e);
    await ctx.reply(M.ERROR);
  }
});

// === Callback: message_admin ===
bot.callbackQuery("message_admin", async (ctx) => {
  try {
    await connectDB();
    await User.updateOne({ userId: ctx.from.id }, { state: "messaging_admin", updatedAt: new Date() });
    await ctx.answerCallbackQuery();
    await ctx.reply(M.MESSAGE_ADMIN_PROMPT, { reply_markup: KB.cancelKeyboard() });
  } catch (e) {
    console.error("message_admin cb error:", e);
    await ctx.reply(M.ERROR);
  }
});

// === Callback: apply ===
bot.callbackQuery("apply", async (ctx) => {
  try {
    await connectDB();
    const user = await User.findOne({ userId: ctx.from.id });
    await ctx.answerCallbackQuery();

    if (!user) {
      await ctx.reply("Boshlash uchun /start yuboring.");
      return;
    }

    if (user.applicationStatus === "pending") {
      await ctx.reply(M.ALREADY_APPLIED, { reply_markup: KB.mainMenuKeyboard() });
      return;
    }

    // DraftApplication ni yaratib/yangilab olamiz
    const draft = await DraftApplication.findOne({ userId: user.userId });
    if (!draft) {
      await DraftApplication.findOneAndUpdate(
        { userId: user.userId },
        { userId: user.userId, files: [], expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
        { upsert: true }
      );
    }

    // Foydalanuvchi state
    await User.updateOne({ userId: user.userId }, { state: "collecting_application", updatedAt: new Date() });

    // Agar oldindan fayllar bo'lsa, in-progress xabar
    const existing = draft?.files?.length || 0;
    if (existing > 0) {
      await ctx.reply(`${M.IN_PROGRESS}\n(Oldindan qo‘shilgan fayllar: ${existing} ta)`, {
        reply_markup: KB.submitApplicationKeyboard()
      });
    } else {
      await ctx.reply(M.APPLY_PROMPT, { reply_markup: KB.cancelKeyboard() });
    }
  } catch (e) {
    console.error("apply cb error:", e);
    await ctx.reply(M.ERROR);
  }
});

// === Callback: submit_application ===
bot.callbackQuery("submit_application", async (ctx) => {
  try {
    await connectDB();
    await ctx.answerCallbackQuery();

    const user = await User.findOne({ userId: ctx.from.id });
    if (!user) {
      await ctx.reply("Boshlash uchun /start yuboring.");
      return;
    }

    const draft = await DraftApplication.findOne({ userId: user.userId });
    const files = draft?.files || [];
    if (files.length === 0) {
      await ctx.reply(M.NEED_FILE);
      return;
    }

    // Application yaratamiz
    const app = await Application.create({
      userId: user.userId,
      files,
      status: "submitted",
      submittedAt: new Date()
    });

    // Admin guruhga yuboramiz (summarize + fayllar)
    let summary = `📋 YANGI ARIZA\n\n👤 Foydalanuvchi: ${escapeHtml(user.firstName || "")} ${escapeHtml(user.lastName || "")}\n🆔 ID: ${user.userId}\n📁 Fayllar soni: ${files.length}\n`;
    files.forEach((f, i) => {
      summary += `\n${i + 1}. ${f.fileName} (${formatFileSize(f.fileSize)})`;
    });

    const root = await bot.api.sendMessage(
      ADMIN_GROUP_ID,
      summary,
      { ...adminThreadOptions(APPLICATION_TOPIC_ID), reply_markup: KB.adminApplicationActions(String(app._id)) }
    );

    // Map: admin post ↔ user
    await ThreadMap.create({
      groupMessageId: root.message_id,
      userId: user.userId,
      kind: "application",
      applicationId: app._id
    });

    // Fayllarni reply qilib yuboramiz
    for (const f of files) {
      try {
        await sendMedia(bot.api, ADMIN_GROUP_ID, f, {
          ...adminThreadOptions(APPLICATION_TOPIC_ID),
          reply_to_message_id: root.message_id
        });
      } catch (err) {
        console.error("File send error:", err);
      }
    }

    // Log
    await Message.create({
      userId: user.userId,
      direction: "to_admin",
      kind: "application",
      content: `Application ${app._id} yuborildi (${files.length} fayl)`,
      groupMessageId: root.message_id,
      topicId: APPLICATION_TOPIC_ID
    });

    // Clean up draft / user status
    await DraftApplication.deleteOne({ userId: user.userId });
    await User.updateOne({ userId: user.userId }, { state: "none", applicationStatus: "pending", updatedAt: new Date() });

    await ctx.reply(M.APPLICATION_RECEIVED, { reply_markup: KB.mainMenuKeyboard() });
  } catch (e) {
    console.error("submit_application cb error:", e);
    await ctx.reply(M.ERROR);
  }
});

// === Callback: cancel / back_to_menu ===
bot.callbackQuery("cancel", async (ctx) => {
  try {
    await connectDB();
    await ctx.answerCallbackQuery();
    await User.updateOne({ userId: ctx.from.id }, { state: "none", updatedAt: new Date() });
    // Draftni o'chirmaymiz (agar foydalanuvchi qaytsa, qolgan fayllar turaversin)
    await ctx.reply(M.CANCELLED, { reply_markup: KB.mainMenuKeyboard() });
  } catch (e) {
    console.error("cancel cb error:", e);
    await ctx.reply(M.ERROR);
  }
});

bot.callbackQuery("back_to_menu", async (ctx) => {
  try {
    await connectDB();
    await ctx.answerCallbackQuery();
    await User.updateOne({ userId: ctx.from.id }, { state: "none", updatedAt: new Date() });
    await ctx.reply(M.WELCOME, { reply_markup: KB.mainMenuKeyboard() });
  } catch (e) {
    console.error("back_to_menu cb error:", e);
    await ctx.reply(M.ERROR);
  }
});

// === Admin: approve / reject / request_more ===
bot.callbackQuery(/app:(approve|reject|request_more):(.+)/, async (ctx) => {
  try {
    await connectDB();
    const [, action, appId] = ctx.match;
    const app = await Application.findById(appId);
    if (!app) {
      await ctx.answerCallbackQuery({ text: "Ariza topilmadi.", show_alert: true });
      return;
    }

    const user = await User.findOne({ userId: app.userId });
    if (!user) {
      await ctx.answerCallbackQuery({ text: "Foydalanuvchi topilmadi.", show_alert: true });
      return;
    }

    if (action === "approve") {
      app.status = "approved";
      app.processedAt = new Date();
      await app.save();
      await User.updateOne({ userId: user.userId }, { applicationStatus: "approved", updatedAt: new Date() });

      await bot.api.sendMessage(user.userId, M.APPROVED_USER);
      await ctx.editMessageReplyMarkup(); // tugmalarni olib tashlash
      await ctx.answerCallbackQuery({ text: "Tasdiqlandi ✅" });
    } else if (action === "reject") {
      app.status = "rejected";
      app.processedAt = new Date();
      await app.save();
      await User.updateOne({ userId: user.userId }, { applicationStatus: "rejected", updatedAt: new Date() });

      await bot.api.sendMessage(user.userId, M.REJECTED_USER());
      await ctx.editMessageReplyMarkup();
      await ctx.answerCallbackQuery({ text: "Rad etildi ❌" });
    } else if (action === "request_more") {
      await bot.api.sendMessage(user.userId, "📎 Iltimos, arizangizni to‘ldirish uchun qo‘shimcha fayllarni yuboring.");
      await ctx.answerCallbackQuery({ text: "Foydalanuvchidan qo‘shimcha fayl so'raldi." });
    }
  } catch (e) {
    console.error("admin app action error:", e);
    await ctx.answerCallbackQuery({ text: "Xatolik.", show_alert: true });
  }
});

// === Message handler ===
bot.on("message", async (ctx) => {
  try {
    await connectDB();
    const chatId = ctx.chat.id;

    // Admin guruh ichida: reply => userga yo'naltirish (media bilan)
    if (chatId === ADMIN_GROUP_ID) {
      const reply = ctx.message.reply_to_message;
      if (!reply) return;

      const rootId = reply.message_id;
      const map = await ThreadMap.findOne({ groupMessageId: rootId });
      if (!map) return;

      const targetUserId = map.userId;
      const file = getFileInfo(ctx.message);
      const textOrCaption = ctx.message.text || ctx.message.caption || "";

      if (file) {
        await sendMedia(bot.api, targetUserId, file, { caption: textOrCaption || undefined });
      } else {
        await bot.api.sendMessage(targetUserId, textOrCaption ? `📨 Admin javobi:\n\n${textOrCaption}` : "📨 Admin sizga javob yubordi.");
      }

      await Message.create({
        userId: targetUserId,
        direction: "to_user",
        content: textOrCaption,
        mediaType: file?.mediaType,
        mediaFileId: file?.fileId,
        fileName: file?.fileName,
        fileSize: file?.fileSize,
        groupMessageId: ctx.message.message_id,
        replyToGroupMessageId: rootId,
        topicId: MESSAGE_TOPIC_ID
      });

      return;
    }

    // User chat
    const user = await User.findOne({ userId: ctx.from.id });
    if (!user) {
      await ctx.reply("Boshlash uchun /start yuboring.");
      return;
    }

    // State based
    if (user.state === "messaging_admin") {
      const file = getFileInfo(ctx.message);
      const textOrCaption = ctx.message.text || ctx.message.caption || "";

      const caption = buildAdminCaptionFromUser(ctx.from, textOrCaption, file);
      let sent;

      if (file) {
        sent = await sendMedia(bot.api, ADMIN_GROUP_ID, file, {
          ...adminThreadOptions(MESSAGE_TOPIC_ID),
          caption
        });
      } else {
        sent = await bot.api.sendMessage(
          ADMIN_GROUP_ID,
          caption,
          { ...adminThreadOptions(MESSAGE_TOPIC_ID), parse_mode: "HTML" }
        );
      }

      // Map: admin post ↔ user
      await ThreadMap.create({
        groupMessageId: sent.message_id,
        userId: user.userId,
        kind: "message"
      });

      await Message.create({
        userId: user.userId,
        direction: "to_admin",
        content: textOrCaption,
        mediaType: file?.mediaType || "text",
        mediaFileId: file?.fileId,
        fileName: file?.fileName,
        fileSize: file?.fileSize,
        groupMessageId: sent.message_id,
        topicId: MESSAGE_TOPIC_ID
      });

      await User.updateOne({ userId: user.userId }, { state: "none", updatedAt: new Date() });
      await ctx.reply(M.MESSAGE_SENT, { reply_markup: KB.backToMenuKeyboard() });
      return;
    }

    if (user.state === "collecting_application") {
      const file = getFileInfo(ctx.message);
      if (!file) {
        await ctx.reply(M.NEED_FILE);
        return;
      }
      if (file.fileSize > MAX_FILE_SIZE) {
        await ctx.reply(M.FILE_TOO_LARGE);
        return;
      }

      await DraftApplication.findOneAndUpdate(
        { userId: user.userId },
        { $push: { files: file }, $set: { expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) } },
        { upsert: true }
      );

      await ctx.reply(M.APPLICATION_DRAFT_ADDED(file.fileName), { reply_markup: KB.submitApplicationKeyboard() });
      return;
    }

    // Default
    await ctx.reply("Iltimos, /start yuboring.", { reply_markup: KB.mainMenuKeyboard() });
  } catch (e) {
    console.error("message handler error:", e);
    await ctx.reply(M.ERROR);
  }
});

// === Error handler ===
bot.catch((e) => {
  console.error("Bot error:", e);
});

module.exports = { bot, ensureBotInit };
