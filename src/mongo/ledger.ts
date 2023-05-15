import { Collection, Db } from 'mongodb';
import { Ledger, PlayerLedger } from '../types';
import { LEDGER_COLLECTION } from './cluster';

const getLedger = async (db: Db, messageId: number, chatId: number) => {
  const ledgerCollection: Collection<Ledger> = db.collection(LEDGER_COLLECTION);
  const ledger = await ledgerCollection.findOne({
    messageId,
    chatId,
  });
  return ledger;
};

const storeLedgerSession = async (
  db: Db,
  messageId: number,
  chatId: number,
  ledger: PlayerLedger[],
) => {
  const ledgerCollection: Collection<Ledger> = db.collection(LEDGER_COLLECTION);
  try {
    await ledgerCollection.insertOne({
      messageId,
      chatId,
      ledger,
    });
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

export { getLedger, storeLedgerSession };
