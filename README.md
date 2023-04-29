# Table of contents
1. [Introduction](https://github.com/nystera/TelegramPokerLedgerBot#poker-ledger-telegram-bot)
2. [Requirements for local testing](https://github.com/nystera/TelegramPokerLedgerBot#requirements-for-local-testing)
3. [Features](https://github.com/nystera/TelegramPokerLedgerBot#features) 
4. [Future development plans](https://github.com/nystera/TelegramPokerLedgerBot#future-development-plans)


## Poker Ledger Telegram Bot
This open-source Telegram bot helps parse and sort poker ledgers from the [pokernow.club](https://www.pokernow.club/) app. It processes CSV ledger files sent to the bot, rearranges the ledger entries from winners to losers, and sends the sorted ledger back to the user.

![image](https://user-images.githubusercontent.com/42372568/235319151-e2803b5d-1251-49b2-bc69-b923c30d02b3.png)



## Requirements for local testing
To set up and test this project locally, follow these steps:

1. Clone the repository and navigate to the project folder:

```bash
git clone https://github.com/nystera/TelegramPokerLedgerBot.git
cd TelegramPokerLedgerBot

```

2. Install the project dependencies using Yarn:
```bash
yarn
```

3. Create a .env file in the project root folder with the following variables:
```.env
BOT_TOKEN=your_bot_token
WEBHOOK_URL=your_webhook_url
```

4. Create a Telegram bot and obtain its token, you can follow these steps:
    1. Open the Telegram app and search for the `BotFather` bot.
    2. Start a chat with `BotFather` and send the `/newbot` command.
    3. Follow the instructions provided by `BotFather` to create a new bot and get its API token.

5. Setup a local public url for the server to hook the webhook onto.
For local webhook testing, you can use a service like `ngrok` to create a public URL for your local server. To set up `ngrok`:
    1. Install `ngrok` globally:
    ```bash
    npm install -g ngrok
    ```
    2. In a new terminal, start `ngrok` to create a tunnel to your local server:
    ```bash
    ngrok http 3000
    ```
    3. Copy the `Forwarding` HTTPS version of the public URL provided by ngrok and set it as the `WEBHOOK_URL` in your `.env` file.
    4. Start the express server:
    ```bash
    yarn run dev
    ```
6. When chatting with the bot, you can do a quick health check by typing `/start` to the bot.
If it replies, it is up and working. You can now send the `.csv` file for them to parse the ledger to you.



## Features
WIP! Currently only able to send .csv file and bot will reply as a collated ledger



## Future Development Plans

Here are some planned features for future development:

1. Allow the bot to be added to a group, so any member can send CSV ledger files.

2. Introduce a feature to mark a ledger as completed or not completed.

3. Set up a database to store the ledger history.

4. Ensure the ledger history only includes the members in the group.

5. Update the ledger history only when it's settled.



### Contributions and suggestions are welcome!

Simply raise an issue or MR and I'll take a look into it (when I have the time xd)
