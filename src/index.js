import express from 'express';
import { Telegraf } from 'telegraf';
import { processCsv } from './utils.js';

import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const botToken = process.env.BOT_TOKEN;
const webhookUrl = process.env.WEBHOOK_URL; // Publicly accessible URL for your server

const bot = new Telegraf(botToken);

bot.start((ctx) => ctx.reply('Welcome'));
bot.help((ctx) => ctx.reply('Send me a .csv file that is exported from pokernow.club'));

bot.on('message', (msg) => {
  if (msg.message.document) {
    const document = msg.message.document;
    const mimeType = document.mime_type;
    const fileId = document.file_id;

    if (mimeType === 'text/csv') {
      bot.telegram.getFileLink(fileId).then(async (link) => {
        const ledgerText = await processCsv(link.href);
        if (ledgerText) {
          const sentMessage = await bot.telegram.sendMessage(msg.chat.id, ledgerText);
          bot.telegram.pinChatMessage(msg.chat.id, sentMessage.message_id, {
            disable_notification: true,
          });
        } else {
          bot.telegram.sendMessage(msg.chat.id, 'CSV file could not be processed');
        }
      });
    }
  }
});

app.use(express.json()); // Parse incoming JSON payloads

// Route to handle updates from the Telegram webhook
app.post('/webhook', async (req, res) => {
  try {
    await bot.handleUpdate(req.body, res);
  } catch (err) {
    console.error(err);
  }
});

app.listen(port, () => {
  console.log(`Express server listening at http://localhost:${port}`);
});

// Set up the webhook for the bot
bot.telegram.setWebhook(`${webhookUrl}/webhook`).then(() => {
  console.log('Webhook has been set');
});
