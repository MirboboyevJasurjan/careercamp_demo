// Bot constants
const COMMANDS = {
    START: '/start'
  };
  
  const CALLBACK_DATA = {
    MESSAGE_ADMIN: 'message_admin',
    APPLY: 'apply',
    SUBMIT_APPLICATION: 'submit_application',
    CANCEL: 'cancel'
  };
  
  const USER_STATES = {
    NONE: 'none',
    MESSAGING_ADMIN: 'messaging_admin',
    SUBMITTING_APPLICATION: 'submitting_application'
  };
  
  const APPLICATION_STATUS = {
    NONE: 'none',
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
  };
  
  const MEDIA_TYPES = {
    TEXT: 'text',
    PHOTO: 'photo',
    AUDIO: 'audio',
    VOICE: 'voice',
    VIDEO: 'video',
    DOCUMENT: 'document',
    STICKER: 'sticker',
    VIDEO_NOTE: 'video_note'
  };
  
  const MESSAGES = {
    WELCOME: '👋 Welcome to the Student Club Registration Bot!\n\nChoose an option below:',
    MESSAGE_ADMIN_PROMPT: '📝 You can now send your message to admin. You can send:\n• Text messages\n• Photos\n• Audio files\n• Documents\n• Videos\n\nSend your message now:',
    MESSAGE_SENT: '✅ Your message has been sent to admin!',
    APPLY_PROMPT: '📄 To apply for the club, please send your application documents.\n\n📋 Requirements:\n• Files must be under 30MB\n• You can send multiple files\n• Supported formats: PDF, DOC, DOCX, images\n\nSend your first document:',
    APPLICATION_RECEIVED: '✅ Your application has been received and is under review.\n\nYou will be notified once the admin reviews your application.',
    FILE_TOO_LARGE: '❌ File is too large! Please send files under 30MB.',
    APPLICATION_APPROVED: '🎉 Congratulations! Your application has been approved.\n\nYou can now submit your documents:',
    APPLICATION_REJECTED: '❌ Sorry, your application has been rejected.',
    ALREADY_APPLIED: '⏳ You have already submitted an application. Please wait for admin review.',
    INVALID_COMMAND: '❓ Invalid command. Please use /start to begin.',
    ERROR: '❌ An error occurred. Please try again later.'
  };
  
  const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB in bytes
  
  module.exports = {
    COMMANDS,
    CALLBACK_DATA,
    USER_STATES,
    APPLICATION_STATUS,
    MEDIA_TYPES,
    MESSAGES,
    MAX_FILE_SIZE
  };