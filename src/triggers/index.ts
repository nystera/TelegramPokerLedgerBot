import { Db } from 'mongodb';
import { Context, Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { Update } from 'telegraf/typings/core/types/typegram';
import { getChat } from '../mongo/chat';
import {
  constructLedgerText,
  getLedgerFromCsv,
  getSortedLedgerFromMap,
} from '../utils';
import { ledgerInlineKeyboard } from '../keyboard';
import { storeLedgerSession } from '../mongo/ledger';

const onCsvTrigger = (bot: Telegraf<Context<Update>>, db: Db) => {
  return bot.on(message('document'), async (ctx) => {
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
          const sortedLedger = getSortedLedgerFromMap(ledger);
          // We check if ledger is successfully inserted in the database
          const sentMessage = await ctx.reply(
            constructLedgerText(sortedLedger),
            {
              reply_markup: ledgerInlineKeyboard(ctx.from.id),
            },
          );
          const isInserted = await storeLedgerSession(
            db,
            sentMessage.message_id,
            ctx.chat.id,
            sortedLedger,
          );
          if (!isInserted) {
            ctx.telegram.editMessageText(
              sentMessage.chat.id,
              sentMessage.message_id,
              null,
              `${sentMessage.text}\n(This ledger could not be saved in the database)`,
            );
          }
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
};

export { onCsvTrigger };
