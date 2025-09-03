const { InlineKeyboard } = require("grammy");

function mainMenuKeyboard() {
  return new InlineKeyboard()
    .text("💬 Adminlarga yozish", "message_admin")
    .text("📝 Ariza topshirish", "apply");
}

function cancelKeyboard() {
  return new InlineKeyboard().text("❌ Bekor qilish", "cancel");
}

function submitApplicationKeyboard() {
  return new InlineKeyboard()
    .text("✅ Arizani topshirish", "submit_application")
    .row()
    .text("❌ Bekor qilish", "cancel");
}

function backToMenuKeyboard() {
  return new InlineKeyboard().text("🏠 Menuga qaytish", "back_to_menu");
}

function adminApplicationActions(appId) {
  return new InlineKeyboard()
    .text("✅ Tasdiqlash", `app:approve:${appId}`)
    .text("❌ Rad etish", `app:reject:${appId}`)
    .row()
    .text("📎 Qo‘shimcha fayl so‘rash", `app:request_more:${appId}`);
}

module.exports = {
  mainMenuKeyboard,
  cancelKeyboard,
  submitApplicationKeyboard,
  backToMenuKeyboard,
  adminApplicationActions
};
