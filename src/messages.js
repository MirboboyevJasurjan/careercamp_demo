module.exports = {
    WELCOME: "👋 Student Club ro‘yxatga olish botiga xush kelibsiz!\n\nQuyidagi tugmalardan birini tanlang:",
    MESSAGE_ADMIN_PROMPT:
      "📝 Endi adminlarga xabar yuborishingiz mumkin.\n\nQabul qilinadigan turlar:\n• Matn\n• Foto\n• Audio\n• Hujjatlar (PDF, DOC, DOCX, rasm)\n• Video\n\nXabaringizni yuboring:",
    MESSAGE_SENT: "✅ Xabaringiz adminlarga yuborildi!",
    APPLY_PROMPT:
      "📄 Klubga ariza topshirish uchun hujjatlaringizni yuboring.\n\n📋 Talablar:\n• Fayl hajmi — 30MB dan kichik\n• Bir nechta fayl yuborishingiz mumkin\n• Formatlar: PDF, DOC, DOCX, rasm, video, audio\n\nBirinchi hujjatingizni yuboring:",
    APPLICATION_DRAFT_ADDED: (name) =>
      `✅ \"${name}\" arizangizga qo‘shildi.\n\nYana fayl yuborishingiz mumkin yoki “✅ Arizani topshirish” tugmasini bosing.`,
    APPLICATION_RECEIVED:
      "✅ Arizangiz qabul qilindi va ko‘rib chiqilmoqda. Natija haqida xabar beramiz.",
    FILE_TOO_LARGE: "❌ Fayl juda katta! 30MB dan kichik fayl yuboring.",
    ALREADY_APPLIED: "⏳ Siz allaqachon ariza yuborgansiz. Admin tekshiruvi yakunlanishini kuting.",
    IN_PROGRESS: "⏳ Siz hozir ariza to‘ldirish jarayonidasiz. Fayllarni yuborishni davom ettiring yoki “✅ Arizani topshirish” tugmasini bosing.",
    INVALID_COMMAND: "❓ Noto‘g‘ri buyruq. Boshlash uchun /start yuboring.",
    ERROR: "❌ Xatolik yuz berdi. Iltimos, birozdan so‘ng yana urinib ko‘ring.",
    CANCELLED: "❌ Amal bekor qilindi.",
    APPROVED_USER: "🎉 Tabriklaymiz! Arizangiz tasdiqlandi.",
    REJECTED_USER: (note) => `❌ Afsuski, arizangiz rad etildi.${note ? `\nIzoh: ${note}` : ""}`,
    NEED_FILE: "📎 Iltimos, arizangiz uchun fayl yuboring.",
    BACK_TO_MENU: "🏠 Menuga qaytish uchun /start yuboring."
  };
  