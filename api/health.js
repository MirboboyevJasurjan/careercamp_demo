module.exports = (req, res) => {
  res.status(200).json({ ok: true, service: "telegram-club-bot", uptime: process.uptime() });
};
