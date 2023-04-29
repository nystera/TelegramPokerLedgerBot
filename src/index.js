import { Telegraf } from 'telegraf';
import { processCsv } from './utils.js';

import dotenv from 'dotenv';
dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => ctx.reply('Welcome'));
bot.help((ctx) => ctx.reply('Send me a sticker'));

bot.on('message', (msg) => {
  if (msg.message.document) {
    const document = msg.message.document;
    // console.log('what is document', document);
    const mimeType = document.mime_type;
    const fileId = document.file_id;

    if (mimeType === 'text/csv') {
      // we parse the csv file
      bot.telegram.getFileLink(fileId).then(async (link) => {
        // console.log('what is link', link);
        const ledgerText = await processCsv(link.href);
        if (ledgerText) {
          bot.telegram.sendMessage(msg.chat.id, ledgerText);
        } else {
          bot.telegram.sendMessage(msg.chat.id, 'CSV file could not be processed');
        }
      });
    }
  }
});

bot.launch();
console.log('bot started');

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
