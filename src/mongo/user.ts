import { Collection, Db } from 'mongodb';
import { User } from '../types';
import { USER_COLLECTION } from './cluster';
import { encryptPhoneNumber } from '../utils';

const getUser = async (db: Db, userId: number, chatId: number) => {
  const userCollection: Collection<User> = db.collection(USER_COLLECTION);
  // find if chatId exists in the collection
  return await userCollection.findOne({
    userId,
    chatId,
  });
};

const createUser = async (db: Db, newUser: User) => {
  const userCollection: Collection<User> = db.collection(USER_COLLECTION);
  try {
    await userCollection.insertOne(newUser);
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

const updatePhone = async (
  db: Db,
  userId: number,
  chatId: number,
  phoneNumber: string,
) => {
  const userCollection: Collection<User> = db.collection(USER_COLLECTION);
  try {
    await userCollection.updateOne(
      {
        userId,
        chatId,
      },
      {
        $set: {
          encrpytedNumber: encryptPhoneNumber(phoneNumber),
        },
      },
    );
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

const addGameName = async (
  db: Db,
  userId: number,
  chatId: number,
  gameName: string,
) => {
  const userCollection: Collection<User> = db.collection(USER_COLLECTION);
  try {
    await userCollection.updateOne(
      {
        userId,
        chatId,
      },
      {
        $push: {
          gameNames: gameName,
        },
      },
    );
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

const removeGameName = async (
  db: Db,
  userId: number,
  chatId: number,
  gameName: string,
) => {
  const userCollection: Collection<User> = db.collection(USER_COLLECTION);
  try {
    const { modifiedCount } = await userCollection.updateOne(
      {
        userId,
        chatId,
      },
      {
        $pull: {
          gameNames: gameName,
        },
      },
    );
    return !!modifiedCount;
  } catch (err) {
    console.log(err);
    return false;
  }
};

export { getUser, createUser, updatePhone, addGameName, removeGameName };
