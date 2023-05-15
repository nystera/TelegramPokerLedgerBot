import csv from 'csv-parser';
import { Readable } from 'stream';
import dayjs from 'dayjs';
import crypto from 'crypto';
import { PlayerLedger, User } from './types';

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
          const {
            player_nickname,
            net,
          }: {
            player_nickname: string;
            net: string;
          } = row;
          // We multiply the net by 100 as we use dollar value
          const netInt = parseInt(net) * (isCents ? 1 : 100);
          // We want to store the player nickname in lowercase
          if (netInt !== 0) {
            const playerLowercase = player_nickname.toLowerCase();
            // if the player is already in the map
            // we add the net to the existing value
            if (resultMap.has(playerLowercase)) {
              const existingNet = resultMap.get(playerLowercase);
              resultMap.set(playerLowercase, existingNet + netInt);
            }
            // if the player is not in the map
            // we add the player to the map
            else {
              resultMap.set(playerLowercase, netInt);
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

const getSortedLedgerFromMap = (resultMap: Map<string, number>) => {
  const sortedArray: PlayerLedger[] = [];
  for (const [key, value] of resultMap) {
    sortedArray.push({
      gameName: key,
      net: value,
    });
  }
  sortedArray.sort((a, b) => b.net - a.net);
  return sortedArray;
};

const constructLedgerText = (sortedLedger: PlayerLedger[]) => {
  let ledgerText = `Today's Ledger: ${dayjs().format(
    'DD MMM YYYY',
  )} (Transfer to: ${sortedLedger[0].gameName})\n`;
  sortedLedger.forEach(({ gameName, net }) => {
    let result: string;
    if (Math.abs(net).toString().length < 3) {
      result = (net < 0 ? '-' : '') + '0.' + ('0' + net.toString()).slice(-2);
    } else {
      const strValue = net.toString();
      result = strValue.slice(0, -2) + '.' + strValue.slice(-2);
    }
    ledgerText += `${gameName}: ${result}\n`;
  });
  return ledgerText;
};

// We encrypt the phone number before storing it in the database
function encryptPhoneNumber(text: string) {
  const keyBuffer = Buffer.from(process.env.PHONE_NUMBER_KEY, 'hex');
  const ivBuffer = Buffer.from(process.env.PHONE_NUMBER_IV, 'hex');
  const cipher = crypto.createCipheriv(
    process.env.PHONE_NUMBER_ALGORITHM,
    keyBuffer,
    ivBuffer,
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted.toString('hex');
}

function getPhoneNumber(encryptedText: string) {
  const keyBuffer = Buffer.from(process.env.PHONE_NUMBER_KEY, 'hex');
  const ivBuffer = Buffer.from(process.env.PHONE_NUMBER_IV, 'hex');
  const decipher = crypto.createDecipheriv(
    process.env.PHONE_NUMBER_ALGORITHM,
    keyBuffer,
    ivBuffer,
  );
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// For all commands, if it is an empty command it will look like /start@<bot_name> and we want to differentiate it
// from a command that has text in it
const isAtBot = (text: string) => {
  return new RegExp(/^@.*bot/i).test(text);
};

const getGameNameToUserId = (users: User[]) => {
  const gameNameToUserId = new Map<string, number>();
  users.forEach((user) => {
    user.gameNames.forEach((gameName) => {
      gameNameToUserId.set(gameName, user.userId);
    });
  });
  return gameNameToUserId;
};

export {
  getLedgerFromCsv,
  getSortedLedgerFromMap,
  constructLedgerText,
  encryptPhoneNumber,
  getPhoneNumber,
  isAtBot,
  getGameNameToUserId,
};
