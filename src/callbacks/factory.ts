export default {
  DELETE_LEDGER_GETTER: /^delete:(\d+)$/,
  DELETE_LEDGER_SETTER: (userId: number) => `delete:${userId}`,

  SETTLE_LEDGER_GETTER: /^settle:(\d+)$/,
  SETTLE_LEDGER_SETTER: (userId: number) => `settle:${userId}`,

  UNSETTLE_LEDGER_GETTER: /^unsettle:(\d+)$/,
  UNSETTLE_LEDGER_SETTER: (userId: number) => `unsettle:${userId}`,

  SET_CURRENCY_GETTER: /^setCurrency:(-?\d+):(cents|dollars)$/,
  SET_CURRENCY_SETTER: (chatId: number, isCents: boolean) =>
    `setCurrency:${chatId}:${isCents ? 'cents' : 'dollars'}`,

  CONFIRM_PHONE_GETTER: /^confirmPhone:(\d+):(\d+)$/,
  CONFIRM_PHONE_SETTER: (phone: string, userId: number) =>
    `confirmPhone:${phone}:${userId}`,

  CONFIRM_REGISTER_GETTER: /^confirmRegister:(\d+)$/,
  CONFIRM_REGISTER_SETTER: (userId: number) => `confirmRegister:${userId}`,

  // CANCEL: 'cancel',
  CANCEL_GETTER: /^cancel:(\d+)$/,
  CANCEL_SETTER: (userId: number) => `cancel:${userId}`,
};
