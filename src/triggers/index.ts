import { Db } from 'mongodb';
import { Context, Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { Update } from 'telegraf/typings/core/types/typegram';
import { getChat } from '../mongo/chat';
import { constructLedgerText, getLedgerFromCsv } from '../utils';
import { ledgerInlineKeyboard } from '../keyboard';

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
};

export { onCsvTrigger };
