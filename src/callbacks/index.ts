import { Db } from 'mongodb';
import { Context, Telegraf } from 'telegraf';
import { Message, Update } from 'telegraf/typings/core/types/typegram';
import factory from './factory';
import { ledgerInlineKeyboard } from '../keyboard';
import { getChat, initializeChat, updateCentsValue } from '../mongo/chat';
import { createUser, getUser, updatePhone } from '../mongo/user';

// WHEN SETTLED BUTTON IS CLICKED
const callbackSettle = (bot: Telegraf<Context<Update>>, db: Db) => {
  return bot.action(factory.SETTLE_LEDGER_GETTER, (ctx) => {
    const senderId = parseInt(ctx.match[1]);
    const userId = ctx.from.id;
    // We know the settled callback is only sent from the ledger message
    const message = ctx.callbackQuery.message as Message.TextMessage;
    if (senderId === userId) {
      const originalText = message.text;
      // Edit the message to include "Ledger Settled" and strike through the old text
      ctx.telegram.editMessageText(
        message.chat.id,
        message.message_id,
        null,
        `<b>Ledger Settled</b>\n<s>${originalText}</s>`,
        {
          parse_mode: 'HTML',
          reply_markup: ledgerInlineKeyboard(senderId, true),
        },
      );
      // Send an answer to the callback query
      ctx.answerCbQuery('Ledger marked as settled.');
    } else {
      // Another user clicked the button
      ctx.answerCbQuery(
        'Only the user who sent the CSV can mark it as settled.',
      );
    }
  });
};

// WHEN UNSETTLED BUTTON IS CLICKED
const callbackUnsettle = (bot: Telegraf<Context<Update>>, db: Db) => {
  return bot.action(factory.UNSETTLE_LEDGER_GETTER, (ctx) => {
    const senderId = parseInt(ctx.match[1]);
    const userId = ctx.from.id;
    // We know the unsettled callback is only sent from the ledger message
    const message = ctx.callbackQuery.message as Message.TextMessage;
    if (senderId === userId) {
      const originalText = message.text;
      // Edit the message to remove "Ledger Settled"
      ctx.telegram.editMessageText(
        message.chat.id,
        message.message_id,
        null,
        originalText.replace(/Ledger Settled/g, ''),
        {
          parse_mode: 'HTML',
          reply_markup: ledgerInlineKeyboard(senderId, false),
        },
      );
      // Send an answer to the callback query
      ctx.answerCbQuery('Ledger marked as unsettled.');
    } else {
      // Another user clicked the button
      ctx.answerCbQuery(
        'Only the user who sent the CSV can mark it as unsettled.',
      );
    }
  });
};

// WHEN DELETE BUTTON IS CLICKED
const callbackDeleteLedger = (bot: Telegraf<Context<Update>>, db: Db) => {
  return bot.action(factory.DELETE_LEDGER_GETTER, (ctx) => {
    const senderId = parseInt(ctx.match[1]);
    const userId = ctx.from.id;
    if (senderId === userId) {
      // User who sent the CSV clicked the button
      const messageId = ctx.callbackQuery.message.message_id;
      const chatId = ctx.callbackQuery.message.chat.id;
      ctx.telegram.deleteMessage(chatId, messageId);
      ctx.answerCbQuery('Message deleted.');
    } else {
      // Another user clicked the button
      ctx.answerCbQuery(
        'Only the user who sent the CSV can delete the message.',
      );
    }
  });
};

// WHEN CENTS BUTTON IS CLICKED
const callbackSetCurrency = (bot: Telegraf<Context<Update>>, db: Db) => {
  return bot.action(factory.SET_CURRENCY_GETTER, async (ctx) => {
    const chatId = ctx.chat.id;
    const isCentsValue = ctx.match[2] === 'cents';
    try {
      // We check if the chat is already initialized
      const chat = await getChat(db, chatId);
      const messageId = ctx.callbackQuery.message.message_id;
      if (chat) {
        // Update the chat
        await updateCentsValue(db, chatId, isCentsValue);
        ctx.reply(
          'Successfully updated! Now send me a .csv file that is exported from pokernow.club',
        );
      } else {
        // Initialize the chat
        const isInitialized = await initializeChat(db, chatId, isCentsValue);
        // check if insert was successful
        if (isInitialized) {
          // We also delete the message that asked the user if they are using cents
          ctx.reply(
            'Successfully initialized! Now send me a .csv file that is exported from pokernow.club',
          );
        }
      }
      ctx.telegram.deleteMessage(chatId, messageId);
    } catch (e) {
      console.error(e);
      ctx.reply('There was an error initializing the chat. Please try again');
    }
  });
};

// WHEN CONFIRM REGISTER BUTTON IS CLICKED
const callbackRegisterConfirm = (bot: Telegraf<Context<Update>>, db: Db) => {
  return bot.action(factory.CONFIRM_REGISTER, async (ctx) => {
    const chatId = ctx.chat.id;
    const userId = ctx.from.id;
    const messageId = ctx.callbackQuery.message.message_id;
    try {
      // We check if the user is already registered
      const user = await getUser(db, chatId, userId);
      if (!user) {
        await createUser(db, {
          chatId,
          userId,
          net: 0,
          gameNames: [],
        });
        ctx.telegram.sendMessage(
          userId,
          'You have been successfully registered! If you want to add your phone number, please follow the steps for /phone. Note that your phone number will be encrpyted when storing it in the database.',
        );
      } else {
        ctx.telegram.sendMessage(userId, 'You are already registered!');
      }
      ctx.deleteMessage(messageId);
    } catch (e) {
      console.error(e);
      ctx.telegram.sendMessage(
        userId,
        'There was an error registering you. Please try again',
      );
    }
  });
};

// WHEN CONFIRM PHONE BUTTON IS CLICKED
const callbackConfirmPhone = (bot: Telegraf<Context<Update>>, db: Db) => {
  return bot.action(factory.CONFIRM_PHONE_GETTER, async (ctx) => {
    const chatId = ctx.chat.id;
    const userId = ctx.from.id;
    const messageId = ctx.callbackQuery.message.message_id;
    try {
      // We check if the user is already registered
      const user = await getUser(db, chatId, userId);
      if (user) {
        const phone = ctx.match[1];
        await updatePhone(db, chatId, userId, phone);
        ctx.telegram.sendMessage(
          userId,
          'You have successfully updated your phone number!',
        );
      } else {
        ctx.telegram.sendMessage(
          userId,
          'You are not registered! Please register first.',
        );
      }
      ctx.deleteMessage(messageId);
    } catch (e) {
      console.error(e);
      ctx.telegram.sendMessage(
        userId,
        'There was an error adding your phone number. Please try again',
      );
    }
  });
};

// WHEN ANY CANCEL BUTTON IS CLICKED
const callbackCancel = (bot: Telegraf<Context<Update>>, db: Db) => {
  bot.action(factory.CANCEL, async (ctx) => {
    const messageId = ctx.callbackQuery.message.message_id;
    ctx.deleteMessage(messageId);
  });
};

export {
  callbackSettle,
  callbackUnsettle,
  callbackDeleteLedger,
  callbackSetCurrency,
  callbackRegisterConfirm,
  callbackConfirmPhone,
  callbackCancel,
};
