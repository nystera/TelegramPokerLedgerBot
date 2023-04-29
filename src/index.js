import { Telegraf } from 'telegraf';
import { processCsv, inlineKeyboard } from './utils.js';
import dotenv from 'dotenv';
import process from 'process';

dotenv.config();
// const app = express();
const port = process.env.PORT || 3000;
const botToken = process.env.BOT_TOKEN;
const webhookUrl = process.env.WEBHOOK_URL; // Publicly accessible URL for your server
const bot = new Telegraf(botToken);

// ON /start
bot.start((ctx) =>
  ctx.reply('Welcome, in order to get started, send me a .csv file that is exported from pokernow.club'),
);

// ON CSV SEND
bot.on('message', async (msg) => {
  if (msg.message.document && msg.message.document.mime_type === 'text/csv') {
    const senderId = msg.from.id;
    const document = msg.message.document;
    const fileId = document.file_id;
    const fileLink = await bot.telegram.getFileLink(fileId);
    const ledgerText = await processCsv(fileLink.href);
    if (ledgerText) {
      const sentMessage = await bot.telegram.sendMessage(msg.chat.id, ledgerText, {
        reply_markup: inlineKeyboard(senderId),
      });
      bot.telegram.pinChatMessage(msg.chat.id, sentMessage.message_id, {
        disable_notification: true,
      });
    } else {
      bot.telegram.sendMessage(msg.chat.id, 'CSV file could not be processed');
    }
  }
});

// WHEN SETTLED BUTTON IS CLICKED
bot.action(/settled:(\d+)/, (ctx) => {
  const senderId = parseInt(ctx.match[1]);
  const userId = ctx.from.id;

  if (senderId === userId) {
    const messageId = ctx.callbackQuery.message.message_id;
    const chatId = ctx.callbackQuery.message.chat.id;
    const originalText = ctx.callbackQuery.message.text;

    // Edit the message to include "Ledger Settled" and strike through the old text
    ctx.telegram.editMessageText(chatId, messageId, null, `<b>Ledger Settled</b>\n<s>${originalText}</s>`, {
      parse_mode: 'HTML',
    });
    // Send an answer to the callback query
    ctx.answerCbQuery('Ledger marked as settled.');
  } else {
    // Another user clicked the button
    ctx.answerCbQuery('Only the user who sent the CSV can mark it as settled.');
  }
});

// WHEN DELETE BUTTON IS CLICKED
bot.action(/delete:(\d+)/, (ctx) => {
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
