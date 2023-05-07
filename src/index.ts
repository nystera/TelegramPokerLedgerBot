import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import {
  getLedgerFromCsv,
  constructLedgerText,
  getPhoneNumber,
  encryptPhoneNumber,
} from './utils';
import dotenv from 'dotenv';
import process from 'process';
import CALLBACK from './constants/callback';
import { Message } from 'telegraf/typings/core/types/typegram';
import { MongoClient } from 'mongodb';
import { getChat, initializeChat, updateCentsValue } from './mongo/chat';
import commands, { COMMAND_TRIGGERS } from './constants/commands';
import { POKERNOW_DB } from './constants/mongo';
import { createUser, getUser, updatePhone } from './mongo/user';
import {
  centsOptionKeyboard,
  confirmPhoneNumberKeyboard,
  confirmRegisterKeyboard,
  ledgerInlineKeyboard,
} from './keyboard';

import crypto from 'crypto';

dotenv.config();
const port = parseInt(process.env.PORT) || 3000;
const isDevelopment = process.env.NODE_ENV === 'development';
const botToken = isDevelopment
  ? process.env.TEST_BOT_TOKEN
  : process.env.BOT_TOKEN;
const webhookUrl = process.env.WEBHOOK_URL; // Publicly accessible URL for your server
const bot = new Telegraf(botToken!);
const mongoClient = new MongoClient(process.env.MONGO_DB_CONNECTION_STRING!);

async function main() {
  try {
    // Help commands for users
    bot.telegram.setMyCommands(commands);
    // Connect to MongoDB
    await mongoClient.connect();
    const db = mongoClient.db(POKERNOW_DB);

    // ON /start
    bot.start(async (ctx) => {
      const chat = await getChat(db, ctx.chat.id);
      if (chat) {
        ctx.reply(
          'Welcome back, in order to get started, send me a .csv file that is exported from pokernow.club',
        );
      }
      // If chat does not exist, we need to add it to the database
      // after they initialize if their game is using cents or not
      else {
        ctx.reply(
          'Welcome to Poker Ledger Bot! Please first indicate if your games are using cents value.',
          {
            reply_markup: centsOptionKeyboard(ctx.chat.id),
          },
        );
      }
    });

    // ON /register
    bot.command(COMMAND_TRIGGERS.REGISTER, async (ctx) => {
      const chat = await getChat(db, ctx.chat.id);
      if (!chat) {
        ctx.telegram.sendMessage(
          ctx.from.id,
          'It looks like this chat group has not been saved in the database. Please type /start to initialize.',
        );
        return;
      }
      const user = await getUser(db, ctx.from.id, ctx.chat.id);
      if (user) {
        ctx.telegram.sendMessage(
          ctx.from.id,
          "Look's like you have already been registered in this group chat.",
        );
        return;
      }
      ctx.telegram.sendMessage(
        ctx.from.id,
        'Please confirm that you are willing to let us store your credentials with us. We will only take your telegram user id. For security reaons, your phone number is not stored yet and you have to do it in a later step.',
        {
          reply_markup: confirmRegisterKeyboard(),
        },
      );
    });

    // ON /currency
    bot.command(COMMAND_TRIGGERS.CURRENCY, async (ctx) => {
      const chat = await getChat(db, ctx.chat.id);
      if (chat) {
        ctx.reply(
          'Please indicate if future games will be using cents value.',
          {
            reply_markup: centsOptionKeyboard(ctx.chat.id),
          },
        );
      } else {
        ctx.reply('No chat saved. Please type /start to initialize.');
      }
    });

    bot.command(COMMAND_TRIGGERS.PHONE, async (ctx) => {
      const userId = ctx.from.id;
      const chatId = ctx.chat.id;
      const user = await getUser(db, userId, chatId);
      const phoneNumber = ctx.message.text.replace('/phone', '').trim();
      if (!user) {
        ctx.reply('No found user saved in this group. Please /register first.');
        return;
      }
      // If user types with phone number
      if (phoneNumber) {
        ctx.telegram.sendMessage(
          userId,
          `Confirm that you want to store this phone number? (${phoneNumber})\nNote that your number will be stored encrpyted in our database.`,
          {
            reply_markup: confirmPhoneNumberKeyboard(phoneNumber),
          },
        );
        return;
      }
      // We need to check if user is checking for their current number or if they are trying to add a new number
      // Has an existing number saved
      if (user.encrpytedNumber) {
        ctx.telegram.sendMessage(
          userId,
          `Your current phone number is ${getPhoneNumber(
            user.encrpytedNumber,
          )}. If you want to change it, please send me your phone number in the format of /phone XXXXXXXX`,
        );
      } else {
        // Does not have an existing number saved
        ctx.telegram.sendMessage(
          userId,
          'To store your phone number, please send me your phone number in the format of /phone XXXXXXXX',
        );
      }
    });

    bot.on(message('document'), async (ctx) => {
      if (
        ctx.message.document &&
        (ctx.message.document.mime_type === 'text/csv' ||
          // This is for iPhone users
          ctx.message.document.mime_type === 'text/comma-separated-values')
      ) {
        const fileLink = await bot.telegram.getFileLink(
          ctx.message.document.file_id,
        );
        // We get the chat from the database to see if the game is using cents
        const chat = await getChat(db, ctx.chat.id);
        const ledger = await getLedgerFromCsv(fileLink.href, chat?.isCents);
        if (ledger) {
          try {
            const sentMessage = await ctx.reply(
              constructLedgerText(ledger, chat?.isCents),
              {
                reply_markup: ledgerInlineKeyboard(ctx.from.id),
              },
            );
            bot.telegram.pinChatMessage(ctx.chat.id, sentMessage.message_id, {
              disable_notification: true,
            });
          } catch (e) {
            console.error(e);
            ctx.reply('There was an error processing the CSV file.');
          }
        } else {
          ctx.reply(
            'CSV file could not be processed. If you are not planning to use the ledger feature, you can ignore this message.',
          );
        }
      }
    });

    // WHEN SETTLED BUTTON IS CLICKED
    bot.action(CALLBACK.SETTLE, (ctx) => {
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

    // WHEN UNSETTLED BUTTON IS CLICKED
    bot.action(CALLBACK.UNSETTLE, (ctx) => {
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

    // // WHEN DELETE BUTTON IS CLICKED
    bot.action(CALLBACK.DELETE, (ctx) => {
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

    // WHEN CENTS BUTTON IS CLICKED
    bot.action(CALLBACK.INITIALIZE_CENTS, async (ctx) => {
      const chatId = ctx.chat.id;
      const isCentsValue = ctx.match[2] === 'true';
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

    // WHEN CONFIRM REGISTER BUTTON IS CLICKED
    bot.action(CALLBACK.CONFIRM_REGISTER, async (ctx) => {
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

    // WHEN CONFIRM PHONE BUTTON IS CLICKED
    bot.action(CALLBACK.CONFIRM_PHONE, async (ctx) => {
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
            'You have successfully added your phone number!',
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

    // WHEN ANY CANCEL BUTTON IS CLICKED
    bot.action(CALLBACK.CANCEL, async (ctx) => {
      const messageId = ctx.callbackQuery.message.message_id;
      ctx.deleteMessage(messageId);
    });

    // Launch bot
    bot.launch({
      webhook: {
        domain: webhookUrl,
        port: port,
      },
    });
    console.log(`bot has been launched on port ${port}`);

    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  } catch (e) {
    console.error(e);
  }
}
main();
