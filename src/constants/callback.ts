export default {
  DELETE: /^delete:(\d+)$/,
  SETTLE: /^settle:(\d+)$/,
  UNSETTLE: /^unsettle:(\d+)$/,
  INITIALIZE_CENTS: /^initializeCents:(\d+):(true|false)$/,
  CONFIRM_REGISTER: 'confirmRegister',
  CONFIRM_PHONE: /^confirmPhone:(\d+)$/,
  CANCEL: 'cancel',
};
