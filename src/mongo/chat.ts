import { Collection, Db, Document, MongoClient } from 'mongodb';
import { Chat } from '../types';
import { CHAT_COLLECTION } from '../constants/mongo';

const getChat = async (db: Db, chatId: number) => {
  const chatCollection: Collection<Chat> = db.collection(CHAT_COLLECTION);
  // find if chatId exists in the collection
  return await chatCollection.findOne({
    chatId,
  });
};

const initializeChat = async (db: Db, chatId: number, isCents: boolean) => {
  const chatCollection: Collection<Chat> = db.collection(CHAT_COLLECTION);
  const chat: Chat = {
    chatId,
    isCents,
  };
  try {
    await chatCollection.insertOne(chat);
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

export { getChat, initializeChat };
