import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { processCsv, ledgerInlineKeyboard } from './utils';
import dotenv from 'dotenv';
import process from 'process';
import CALLBACK from './constants/callback';
import { Message } from 'telegraf/typings/core/types/typegram';

dotenv.config();
const port = parseInt(process.env.PORT) || 3000;
const isDevelopment = process.env.NODE_ENV === 'development';
const botToken = isDevelopment
  ? process.env.TEST_BOT_TOKEN
  : process.env.BOT_TOKEN;
const webhookUrl = process.env.WEBHOOK_URL; // Publicly accessible URL for your server
const bot = new Telegraf(botToken!);

// ON /start
bot.start((ctx) =>
  ctx.reply(
    'Welcome, in order to get started, send me a .csv file that is exported from pokernow.club',
  ),
);

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
    const ledgerText = await processCsv(fileLink.href);
    if (ledgerText) {
      try {
        const sentMessage = await bot.telegram.sendMessage(
          ctx.chat.id,
          ledgerText,
          {
            reply_markup: ledgerInlineKeyboard(ctx.from.id),
          },
        );
        bot.telegram.pinChatMessage(ctx.chat.id, sentMessage.message_id, {
          disable_notification: true,
        });
      } catch (e) {
        console.error(e);
        bot.telegram.sendMessage(
          ctx.chat.id,
          'There was an error processing the CSV file.',
        );
      }
    } else {
      bot.telegram.sendMessage(
        ctx.chat.id,
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
    ctx.answerCbQuery('Only the user who sent the CSV can mark it as settled.');
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
    ctx.answerCbQuery('Only the user who sent the CSV can delete the message.');
  }
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
