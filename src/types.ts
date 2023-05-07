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

export { Chat, User };
