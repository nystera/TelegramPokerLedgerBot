export const COMMAND_TRIGGERS = {
  START: 'start',
  REGISTER: 'register',
  CURRENCY: 'currency',
  PHONE: 'phone',
  ADD_GAMENAME: 'add_gamename',
};

export default [
  { command: COMMAND_TRIGGERS.START, description: 'Start the bot' },
  {
    command: COMMAND_TRIGGERS.REGISTER,
    description: 'Registers your name and phone number for ledger updates',
  },
  {
    command: COMMAND_TRIGGERS.CURRENCY,
    description: 'Change the currency future ledgers will be in',
  },
  {
    command: COMMAND_TRIGGERS.PHONE,
    description: 'Change the phone number future ledgers will be sent to',
  },
  {
    command: COMMAND_TRIGGERS.ADD_GAMENAME,
    description: 'Add game names that you play with',
  },
];
