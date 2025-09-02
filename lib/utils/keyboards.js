const { CALLBACK_DATA } = require('./constants');

const mainMenuKeyboard = {
  inline_keyboard: [
    [
      { text: '💬 Message Admin', callback_data: CALLBACK_DATA.MESSAGE_ADMIN },
      { text: '📝 Apply', callback_data: CALLBACK_DATA.APPLY }
    ]
  ]
};

const cancelKeyboard = {
  inline_keyboard: [
    [
      { text: '❌ Cancel', callback_data: CALLBACK_DATA.CANCEL }
    ]
  ]
};

const submitApplicationKeyboard = {
  inline_keyboard: [
    [
      { text: '✅ Submit Application', callback_data: CALLBACK_DATA.SUBMIT_APPLICATION }
    ],
    [
      { text: '❌ Cancel', callback_data: CALLBACK_DATA.CANCEL }
    ]
  ]
};

const backToMenuKeyboard = {
  inline_keyboard: [
    [
      { text: '🏠 Back to Menu', callback_data: 'back_to_menu' }
    ]
  ]
};

module.exports = {
  mainMenuKeyboard,
  cancelKeyboard,
  submitApplicationKeyboard,
  backToMenuKeyboard
};