import { Markup } from 'telegraf';
import factory from './callbacks/factory';

const cancelButton = (userId: number) =>
  Markup.button.callback('Cancel', factory.CANCEL_SETTER(userId));

const ledgerInlineKeyboard = (senderId: number, isSettled?: boolean) => {
  const settledButtonText = isSettled ? 'Undo Settled' : 'Mark as Settled';
  const settledCallback = isSettled
    ? factory.UNSETTLE_LEDGER_SETTER(senderId)
    : factory.SETTLE_LEDGER_SETTER(senderId);
  return Markup.inlineKeyboard([
    Markup.button.callback(settledButtonText, settledCallback),
    Markup.button.callback('Delete', factory.DELETE_LEDGER_SETTER(senderId)),
  ]).reply_markup;
};

const centsOptionKeyboard = (chatId: number) => {
  return Markup.inlineKeyboard([
    Markup.button.callback(
      'Use dollar value',
      factory.SET_CURRENCY_SETTER(chatId, false),
    ),
    Markup.button.callback(
      'Use cents value',
      factory.SET_CURRENCY_SETTER(chatId, true),
    ),
  ]).reply_markup;
};

const confirmRegisterKeyboard = (userId: number) => {
  return Markup.inlineKeyboard([
    Markup.button.callback('Confirm', factory.CONFIRM_REGISTER_SETTER(userId)),
    cancelButton(userId),
  ]).reply_markup;
};

const confirmPhoneNumberKeyboard = (phone: string, userId: number) => {
  return Markup.inlineKeyboard([
    Markup.button.callback(
      'Confirm',
      factory.CONFIRM_PHONE_SETTER(phone, userId),
    ),
    // add userId here
    cancelButton(userId),
  ]).reply_markup;
};

export {
  ledgerInlineKeyboard,
  centsOptionKeyboard,
  confirmRegisterKeyboard,
  confirmPhoneNumberKeyboard,
};
