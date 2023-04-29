import fetch from 'node-fetch';
import csv from 'csv-parser';
import { Readable } from 'stream';

const processCsv = async (fileLink) => {
  try {
    const response = await fetch(fileLink);
    const fileArrayBuffer = await response.arrayBuffer();
    const fileBuffer = Buffer.from(fileArrayBuffer);
    const stream = Readable.from(fileBuffer);

    // Wrap the stream processing in a Promise
    const ledgerTextPromise = new Promise((resolve) => {
      const resultMap = new Map();
      stream
        .pipe(csv())
        .on('data', (row) => {
          const { player_nickname, net } = row;
          // We divide the net by 100 as we use cents value
          const netInt = parseInt(net) / 100;
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
          const resultArray = getMapToSortedArray(resultMap);
          let ledgerText = `Today's Ledger: ${getCurrentDateFormatted()} (Transfer to: ${
            resultArray[0].player_nickname
          })\n`;
          resultArray.forEach(({ player_nickname, net }) => {
            ledgerText += `${player_nickname}: ${net}\n`;
          });
          resolve(ledgerText); // Resolve the Promise with the ledgerText
        });
    });
    // Wait for the Promise to resolve before returning the ledgerText
    return await ledgerTextPromise;
  } catch (e) {
    console.error(e);
    return undefined;
  }
};

function getCurrentDateFormatted() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

const getMapToSortedArray = (map) => {
  const sortedArray = [];
  for (const [key, value] of map) {
    sortedArray.push({ player_nickname: key, net: Number(value).toFixed(2) });
  }
  return sortedArray.sort((a, b) => b.net - a.net);
};

export { processCsv };