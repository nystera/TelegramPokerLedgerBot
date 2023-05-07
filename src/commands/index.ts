import { Context, Telegraf } from 'telegraf';
import { Update } from 'telegraf/typings/core/types/typegram';
import { getChat } from '../mongo/chat';
import { Db } from 'mongodb';
import {
  centsOptionKeyboard,
  confirmPhoneNumberKeyboard,
  confirmRegisterKeyboard,
} from '../keyboard';
import { COMMAND_TRIGGERS } from './list';
import { getUser } from '../mongo/user';
import { getPhoneNumber } from '../utils';

// ON /start
const handleStart = (bot: Telegraf<Context<Update>>, db: Db) => {
  return bot.start(async (ctx) => {
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
};

// ON /register
const handleRegister = (bot: Telegraf<Context<Update>>, db: Db) => {
  return bot.command(COMMAND_TRIGGERS.REGISTER, async (ctx) => {
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
};

// ON /currency
const handleCurrency = (bot: Telegraf<Context<Update>>, db: Db) => {
  return bot.command(COMMAND_TRIGGERS.CURRENCY, async (ctx) => {
    const chat = await getChat(db, ctx.chat.id);
    if (chat) {
      ctx.reply('Please indicate if future games will be using cents value.', {
        reply_markup: centsOptionKeyboard(ctx.chat.id),
      });
    } else {
      ctx.reply('No chat saved. Please type /start to initialize.');
    }
  });
};

// ON /phone
const handlePhone = (bot: Telegraf<Context<Update>>, db: Db) => {
  return bot.command(COMMAND_TRIGGERS.PHONE, async (ctx) => {
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
};

export { handleStart, handleRegister, handleCurrency, handlePhone };
