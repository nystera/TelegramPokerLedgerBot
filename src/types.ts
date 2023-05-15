type Chat = {
  chatId: number;
  isCents: boolean;
};

type User = {
  userId: number;
  chatId: number;
  encrpytedNumber?: string;
  net: number;
  gameNames: string[];
};

type PlayerLedger = {
  gameName: string;
  net: number;
};

type Ledger = {
  messageId: number;
  chatId: number;
  ledger: PlayerLedger[];
};

export { Chat, User, PlayerLedger, Ledger };
