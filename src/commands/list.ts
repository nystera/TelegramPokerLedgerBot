export const COMMAND_TRIGGERS = {
  START: 'start',
  ME: 'me',
  REGISTER: 'register',
  CURRENCY: 'currency',
  PHONE: 'phone',
  ADD_GAMENAME: 'addname',
  REMOVE_GAMENAME: 'removename',
};

export const COMMAND_LIST = [
  { command: COMMAND_TRIGGERS.START, description: 'Start the bot' },
  {
    command: COMMAND_TRIGGERS.ME,
    description: 'Get your current poker information',
  },
  {
    command: COMMAND_TRIGGERS.REGISTER,
    description: 'Registers your name and phone number for ledger updates',
  },
  {
    command: COMMAND_TRIGGERS.CURRENCY,
    description: "Change group's future ledgers' currency",
  },
  {
    command: COMMAND_TRIGGERS.PHONE,
    description: 'Check or update your phone number stored in the database',
  },
  {
    command: COMMAND_TRIGGERS.ADD_GAMENAME,
    description:
      'Add a game name that you play with, this is for cumulating net profits',
  },
  {
    command: COMMAND_TRIGGERS.REMOVE_GAMENAME,
    description: "Remove a game name that you don't play with anymore",
  },
];
