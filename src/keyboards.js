const { Keyboard, InlineKeyboard } = require("grammy");

// Reply keyboards
function mainMenuKeyboard() {
  return new Keyboard()
    .text("💬 Adminlarga yozish")
    .text("📝 Ariza topshirish")
    .resized();
}

function cancelKeyboard() {
  return new Keyboard()
    .text("❌ Bekor qilish")
    .text("🏠 Menuga qaytish")
    .resized();
}

function submitApplicationKeyboard() {
  return new Keyboard()
    .text("✅ Arizani topshirish")
    .row()
    .text("❌ Bekor qilish")
    .text("🏠 Menuga qaytish")
    .resized();
}

// Inline for admin actions (post ostida)
function adminApplicationActions(appId) {
  return new InlineKeyboard()
    .text("✅ Approve", `app:approve:${appId}`)
    .text("❌ Reject", `app:reject:${appId}`);
}

module.exports = {
  mainMenuKeyboard,
  cancelKeyboard,
  submitApplicationKeyboard,
  adminApplicationActions,
};
