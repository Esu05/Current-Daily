# UPSC Daily

A daily UPSC pack (current affairs plus history of the day) built by an open-weight model running through Ollama.

## Run the site
npm install
npm run dev

## Run the pipeline on your laptop
ollama pull gemma2: 3b
npm run daily

## Automate
1. Push to GitHub.
2. Add repo secrets TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID (create a bot with @BotFather).
3. Actions tab: run "daily-pack" once manually.
4. Import the repo in Vercel. Every data commit redeploys the site.
