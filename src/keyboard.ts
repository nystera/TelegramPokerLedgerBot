import { Markup } from 'telegraf';

const cancelButton = Markup.button.callback('Cancel', 'cancel');

const ledgerInlineKeyboard = (senderId: number, isSettled?: boolean) => {
  const settledButtonText = isSettled ? 'Undo Settled' : 'Mark as Settled';
  const settledCallback = isSettled
    ? `unsettle:${senderId}`
    : `settle:${senderId}`;
  return Markup.inlineKeyboard([
    Markup.button.callback(settledButtonText, settledCallback),
    Markup.button.callback('Delete', `delete:${senderId}`), // Add a delete button
  ]).reply_markup;
};

const centsOptionKeyboard = (chatId: number) => {
  return Markup.inlineKeyboard([
    Markup.button.callback(
      'Use dollar value',
      `initializeCents:${chatId}:false`,
    ),
    Markup.button.callback('Use cents value', `initializeCents:${chatId}:true`),
  ]).reply_markup;
};

const confirmRegisterKeyboard = () => {
  return Markup.inlineKeyboard([
    Markup.button.callback('Confirm storage of data', 'confirmRegister'),
    cancelButton,
  ]).reply_markup;
};

const confirmPhoneNumberKeyboard = (phone: string) => {
  return Markup.inlineKeyboard([
    Markup.button.callback('Confirm phone number', `confirmPhone:${phone}`),
    cancelButton,
  ]).reply_markup;
};

export {
  ledgerInlineKeyboard,
  centsOptionKeyboard,
  confirmRegisterKeyboard,
  confirmPhoneNumberKeyboard,
};
