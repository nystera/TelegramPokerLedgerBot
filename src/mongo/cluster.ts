// We use the test database for testing purposes, and live if we are in production
export const POKERNOW_DB =
  process.env.NODE_ENV === 'production' ? 'pokernow' : 'pokernow_test';

export const CHAT_COLLECTION = 'chat';

export const USER_COLLECTION = 'user';

export const LEDGER_COLLECTION = 'ledger';
