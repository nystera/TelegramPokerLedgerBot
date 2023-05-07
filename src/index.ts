import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import process from 'process';
import { MongoClient } from 'mongodb';
import { COMMAND_LIST } from './commands/list';
import { POKERNOW_DB } from './mongo/cluster';
import {
  handleCurrency,
  handlePhone,
  handleRegister,
  handleStart,
} from './commands';
import { onCsvTrigger } from './triggers';
import {
  callbackCancel,
  callbackConfirmPhone,
  callbackDeleteLedger,
  callbackRegisterConfirm,
  callbackSetCurrency,
  callbackSettle,
  callbackUnsettle,
} from './callbacks';

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
    bot.telegram.setMyCommands(COMMAND_LIST);
    // Connect to MongoDB
    await mongoClient.connect();
    const db = mongoClient.db(POKERNOW_DB);

    // COMMANDS
    handleStart(bot, db);
    handleRegister(bot, db);
    handleCurrency(bot, db);
    handlePhone(bot, db);

    // TRIGGERS
    onCsvTrigger(bot, db);

    // CALLBACKS
    callbackSettle(bot, db);
    callbackUnsettle(bot, db);
    callbackDeleteLedger(bot, db);
    callbackSetCurrency(bot, db);
    callbackRegisterConfirm(bot, db);
    callbackConfirmPhone(bot, db);
    callbackCancel(bot, db);

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
