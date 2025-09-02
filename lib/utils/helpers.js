const { MEDIA_TYPES } = require('./constants');

// Extract file information from Telegram message
const getFileInfo = (msg) => {
  if (msg.photo) {
    const photo = msg.photo[msg.photo.length - 1]; // Get highest resolution
    return {
      mediaType: MEDIA_TYPES.PHOTO,
      fileId: photo.file_id,
      fileSize: photo.file_size,
      fileName: `photo_${Date.now()}.jpg`
    };
  }

  if (msg.audio) {
    return {
      mediaType: MEDIA_TYPES.AUDIO,
      fileId: msg.audio.file_id,
      fileSize: msg.audio.file_size,
      fileName: msg.audio.file_name || `audio_${Date.now()}.mp3`
    };
  }

  if (msg.voice) {
    return {
      mediaType: MEDIA_TYPES.VOICE,
      fileId: msg.voice.file_id,
      fileSize: msg.voice.file_size,
      fileName: `voice_${Date.now()}.ogg`
    };
  }

  if (msg.video) {
    return {
      mediaType: MEDIA_TYPES.VIDEO,
      fileId: msg.video.file_id,
      fileSize: msg.video.file_size,
      fileName: msg.video.file_name || `video_${Date.now()}.mp4`
    };
  }

  if (msg.document) {
    return {
      mediaType: MEDIA_TYPES.DOCUMENT,
      fileId: msg.document.file_id,
      fileSize: msg.document.file_size,
      fileName: msg.document.file_name || `document_${Date.now()}`
    };
  }

  if (msg.video_note) {
    return {
      mediaType: MEDIA_TYPES.VIDEO_NOTE,
      fileId: msg.video_note.file_id,
      fileSize: msg.video_note.file_size,
      fileName: `video_note_${Date.now()}.mp4`
    };
  }

  if (msg.sticker) {
    return {
      mediaType: MEDIA_TYPES.STICKER,
      fileId: msg.sticker.file_id,
      fileSize: msg.sticker.file_size,
      fileName: `sticker_${Date.now()}.webp`
    };
  }

  return null;
};

// Format user info for admin
const formatUserInfo = (user) => {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'No name';
  const username = user.username ? `@${user.username}` : 'No username';
  return `👤 User: ${name} (${username})\n🆔 ID: ${user.userId}`;
};

// Format file size in readable format
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Check if message is from admin group
const isFromAdminGroup = (msg) => {
  return msg.chat.id.toString() === process.env.ADMIN_GROUP_ID;
};

// Extract user ID from admin reply
const extractUserIdFromReply = (msg) => {
  if (!msg.reply_to_message || !msg.reply_to_message.text) return null;
  
  const match = msg.reply_to_message.text.match(/🆔 ID: (\d+)/);
  return match ? parseInt(match[1]) : null;
};

// Create message content for admin group
const createAdminMessage = (user, content, fileInfo = null) => {
  let message = `${formatUserInfo(user)}\n\n`;
  
  if (content) {
    message += `💬 Message: ${content}\n`;
  }
  
  if (fileInfo) {
    message += `📎 File: ${fileInfo.fileName}\n`;
    message += `📊 Size: ${formatFileSize(fileInfo.fileSize)}\n`;
    message += `🗂 Type: ${fileInfo.mediaType.toUpperCase()}`;
  }
  
  return message;
};

module.exports = {
  getFileInfo,
  formatUserInfo,
  formatFileSize,
  isFromAdminGroup,
  extractUserIdFromReply,
  createAdminMessage
};
