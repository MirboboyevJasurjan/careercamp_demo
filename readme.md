# Telegram Club Bot (UZ) — Vercel + MongoDB + grammY

Telegram’da **adminlarga yozish** va **ariza (hujjatlar) topshirish** jarayonini avtomatlashtiruvchi bot.
Vercel webhook (serverless) formatida 24/7 ishlaydi — **hech qanday long-polling yo‘q**.

## Xususiyatlar
- 💬 Foydalanuvchi → Admin guruh: matn va media xabarlar
- 📝 Ariza topshirish: bir nechta fayl (PDF/DOC/DOCX/rasm/video/audio), so‘ng **Submit**
- 🧵 Admin guruhda tartib (topics/thread) uchun ixtiyoriy `MESSAGE_TOPIC_ID` va `APPLICATION_TOPIC_ID`
- ✅ Admin uchun inline tugmalar: **Tasdiqlash / Rad etish / Qo‘shimcha fayl so‘rash**
- 🔁 Admin javoblari foydalanuvchiga media bilan birga yetkaziladi
- 💾 MongoDB’da foydalanuvchi, xabarlar, draft va arizalar saqlanadi
- 🔐 **Hech qanday secret kodga YOZILMAYDI** — barchasi Vercel Environment Variables orqali

## Tuzilma
