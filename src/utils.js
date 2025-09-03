function escapeHtml(s = "") {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  
  function formatFileSize(bytes = 0) {
    if (!bytes) return "0 B";
    const k = 1024, sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }
  
  function makeUserLink(fromOrUserDoc) {
    const id = fromOrUserDoc.id ?? fromOrUserDoc.userId;
    const name = fromOrUserDoc.first_name ?? fromOrUserDoc.firstName ?? "Foydalanuvchi";
    const safe = escapeHtml(name);
    return `<a href="tg://user?id=${id}">${safe}</a>`;
  }
  
  function getFileInfo(msg) {
    if (msg.photo) {
      const photo = msg.photo[msg.photo.length - 1];
      return { mediaType: "photo", fileId: photo.file_id, fileSize: photo.file_size, fileName: `photo_${Date.now()}.jpg` };
    }
    if (msg.audio) {
      return { mediaType: "audio", fileId: msg.audio.file_id, fileSize: msg.audio.file_size, fileName: msg.audio.file_name || `audio_${Date.now()}.mp3` };
    }
    if (msg.voice) {
      return { mediaType: "voice", fileId: msg.voice.file_id, fileSize: msg.voice.file_size, fileName: `voice_${Date.now()}.ogg` };
    }
    if (msg.video) {
      return { mediaType: "video", fileId: msg.video.file_id, fileSize: msg.video.file_size, fileName: msg.video.file_name || `video_${Date.now()}.mp4` };
    }
    if (msg.document) {
      return { mediaType: "document", fileId: msg.document.file_id, fileSize: msg.document.file_size, fileName: msg.document.file_name || `document_${Date.now()}` };
    }
    if (msg.video_note) {
      return { mediaType: "video_note", fileId: msg.video_note.file_id, fileSize: msg.video_note.file_size, fileName: `video_note_${Date.now()}.mp4` };
    }
    return null;
  } 
  
  async function sendMedia(api, chatId, file, options) {
    switch (file.mediaType) {
      case "photo": return api.sendPhoto(chatId, file.fileId, options);
      case "audio": return api.sendAudio(chatId, file.fileId, options);
      case "voice": return api.sendVoice(chatId, file.fileId, options);
      case "video": return api.sendVideo(chatId, file.fileId, options);
      case "document": return api.sendDocument(chatId, file.fileId, options);
      case "video_note": return api.sendVideoNote(chatId, file.fileId, options);
      default: return api.sendDocument(chatId, file.fileId, options);
    }
  }
  
  module.exports = { escapeHtml, formatFileSize, makeUserLink, getFileInfo, sendMedia };
  