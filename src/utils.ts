import csv from 'csv-parser';
import { Readable } from 'stream';
import dayjs from 'dayjs';
import { Markup } from 'telegraf';

const ledgerInlineKeyboard = (senderId: number, isSettled?: boolean) => {
  const settledButtonText = isSettled ? 'Undo Settled' : 'Mark as Settled';
  const settledCallback = isSettled
    ? `unsettle:${senderId}`
    : `settle:${senderId}`;
  return Markup.inlineKeyboard([
    Markup.button.callback(settledButtonText, settledCallback),
    Markup.button.callback('Delete', `delete:${senderId}`), // Add a delete button
  ]).reply_markup;
};

const centsOptionKeyboard = (chatId: number) => {
  return Markup.inlineKeyboard([
    Markup.button.callback(
      'Use dollar value',
      `initializeCents:${chatId}:false`,
    ),
    Markup.button.callback('Use cents value', `initializeCents:${chatId}:true`),
  ]).reply_markup;
};

const getLedgerFromCsv = async (fileLink: string, isCents?: boolean) => {
  try {
    const response = await fetch(fileLink);
    const fileArrayBuffer = await response.arrayBuffer();
    const fileBuffer = Buffer.from(fileArrayBuffer);
    const stream = Readable.from(fileBuffer);

    // Wrap the stream processing in a Promise
    const ledgerPromise = new Promise((resolve) => {
      const resultMap = new Map<string, number>();
      stream
        .pipe(csv())
        .on('data', (row) => {
          const { player_nickname, net } = row;
          // We divide the net by 100 as we use cents value
          const netInt = parseInt(net) / (isCents ? 100 : 1);
          if (netInt !== 0) {
            // if the player is already in the map
            // we add the net to the existing value
            if (resultMap.has(player_nickname)) {
              const existingNet = resultMap.get(player_nickname);
              resultMap.set(player_nickname, existingNet + netInt);
            }
            // if the player is not in the map
            // we add the player to the map
            else {
              resultMap.set(player_nickname, netInt);
            }
          }
        })
        .on('end', () => {
          resolve(resultMap); // Resolve the Promise with the ledger
        });
    });
    // Wait for the Promise to resolve before returning the ledger
    return (await ledgerPromise) as Map<string, number>;
  } catch (e) {
    console.error(e);
    return undefined;
  }
};

const constructLedgerText = (
  resultMap: Map<string, number>,
  isCents?: boolean,
) => {
  const sortedArray = [];
  for (const [key, value] of resultMap) {
    sortedArray.push({
      player_nickname: key,
      net: isCents ? value.toFixed(2) : value,
    });
  }
  sortedArray.sort((a, b) => b.net - a.net);

  let ledgerText = `Today's Ledger: ${dayjs().format(
    'DD MMM YYYY',
  )} (Transfer to: ${sortedArray[0].player_nickname})\n`;
  sortedArray.forEach(({ player_nickname, net }) => {
    ledgerText += `${player_nickname}: ${net}\n`;
  });
  return ledgerText;
};

export {
  ledgerInlineKeyboard,
  centsOptionKeyboard,
  getLedgerFromCsv,
  constructLedgerText,
};
