# Current Daily

A free daily study pack for everyone. Every morning it collects the day's news, keeps the points that matter for the Civil Services exam, adds important historical events for the date, and delivers everything on a website and a Telegram channel. Every evening it sends a short revision reminder.

The filtering and summarising is done by **Gemma 3 (4B)**, an open-weight model that runs through **Ollama**. There is no paid API, no API key, and no cost per run.


## For readers

You do not need to install anything.

1. Open the website to read the day's pack and filter it by GS paper (GS1 to GS4).
2. Join the Telegram channel to get the pack every morning and a revision reminder every evening.
3. Tap the source link on any point to read the full article.

This is a first-pass filter, not a replacement for reading the newspaper or a standard compilation. Summaries are written by a small AI model and can be wrong, so check the source before relying on a point.

## What you get

- **Current affairs:** up to 15 points a day, each with a one-line summary, a line of context, a topic, a GS paper tag, and a link to the original article.
- **On this day:** up to 10 historical events for the date, picked for GS1 relevance.
- **GS filter:** the website shows only the GS papers that have points today, with a count for each.
- **Morning digest:** posted to the Telegram channel after the daily job finishes.
- **Evening revision:** a few points from the last two days, posted at 8:00 PM IST.
- **Archive:** each day is saved as `public/data/YYYY-MM-DD.json`.

## How it works

```
RSS feeds ──> clean ──> Gemma screens each headline ──> topic to GS paper (code) ──> JSON
Wikipedia "On this day" ──> filter ──> Gemma picks up to 10 ──> JSON
JSON ──> website (React) + Telegram digest
```

1. **Collect.** Headlines are read from PIB, The Hindu (editorials, international, economy, science, environment, national) and BusinessLine. One item is taken from each feed in turn, so no single feed fills the list.
2. **Clean.** Code removes city and state pages, sports, entertainment, Hindi headlines, and headlines matching a blocklist (crime, rumour roundups and similar).
3. **Screen.** Gemma reads each remaining headline and summary on its own, gives it a 1 to 5 UPSC usefulness score, and picks a topic. Items scoring 3 or more are kept, up to 15.
4. **Label.** The model picks a topic such as Polity, Economy or Environment. The code maps the topic to a GS paper. The model never chooses the GS paper directly, because small models were unreliable at that.
5. **Link safely.** Each point's URL comes from the feed item that was screened, never from the model, so a link cannot be mismatched with its summary.
6. **History.** Events for the date come from Wikipedia's "On this day" feed. Disasters, attacks and entertainment are filtered out, then Gemma picks up to 10 that are useful for GS1.
7. **Publish.** The result is saved as JSON, the site reads it, and the digest is sent to Telegram. If the feeds or the model fail, the previous data is kept instead of publishing something broken.

## Tech stack

- **Frontend:** React, Vite, Tailwind CSS, lucide-react
- **Pipeline:** Node.js scripts, rss-parser, undici
- **Model:** Gemma 3 4B through Ollama
- **Automation:** GitHub Actions (daily job and evening reminder)
- **Delivery:** Telegram Bot API posting to a public channel
- **Hosting:** Vercel, redeployed automatically when the daily job commits new data

## Project structure

```
.github/workflows/
  daily.yml          daily job: runs Ollama, builds the pack, commits it
  evening.yml        evening revision reminder
public/data/
  latest.json        what the website reads
  YYYY-MM-DD.json    daily archive
scripts/
  run.js             main pipeline
  feeds.js           RSS feeds and cleaning rules
  history.js         Wikipedia "On this day" fetch and filter
  llm.js             Ollama client
  telegram.js        digest builder and sender
  remind.js          evening revision sender
src/
  App.jsx
  components/        Header, GsFilter, AffairCard, HistoryList, RevisionPanel
  hooks/useDailyData.js
```

## Run it yourself

### Requirements

- Node.js 20.6 or newer
- [Ollama](https://ollama.com/download)
- Roughly 8 GB of RAM for the 4B model (a GPU makes it much faster, but is not required)

### Set up

```bash
git clone https://github.com/Esu05/Current-Daily.git
cd Current-Daily
npm install
ollama pull gemma3:4b
```

### Start the website

```bash
npm run dev
```

The site reads `public/data/latest.json`, which is included in the repo.

### Generate a new pack

Make sure Ollama is running, then:

```bash
npm run daily
```

This takes a while on a laptop CPU, because each headline is a separate model call. Progress is printed for every headline.

### Environment variables

| Variable | Purpose | Default |
|---|---|---|
| `OLLAMA_MODEL` | Model used for screening | `gemma3:4b` |
| `OLLAMA_HOST` | Ollama server address | `http://localhost:11434` |
| `TELEGRAM_BOT_TOKEN` | Bot token from BotFather | none (sending is skipped) |
| `TELEGRAM_CHAT_ID` | Channel username such as `@YourChannel`, or a chat id | none (sending is skipped) |

If the Telegram variables are not set, the pipeline still runs and simply skips the send.

## Run your own copy with automation

1. Fork the repo and keep it public. GitHub Actions is free for public repositories.
2. Create a bot with [@BotFather](https://t.me/BotFather) and copy the token.
3. Create a public Telegram channel and add your bot as an administrator with permission to post messages.
4. In your fork, go to Settings, Secrets and variables, Actions, and add two repository secrets: `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` (set it to `@YourChannelUsername`).
5. In the Actions tab, run `daily-pack` once by hand to check it works.
6. Import the repo in Vercel and keep the defaults. Each daily data commit redeploys the site.
7. Update the channel link in `src/components/Header.jsx`.

The daily job installs Ollama and pulls the model on a GitHub runner with no GPU, so a full run takes roughly 35 minutes. Set the schedule in `daily.yml` early enough that the digest lands when you want it.

## Customise it

- **Sources:** edit the `FEEDS` list in `scripts/feeds.js`.
- **Junk filtering:** add words to `SKIP_TITLE` in `scripts/feeds.js` when you spot a bad point. This is the quickest way to improve quality over time.
- **What counts as UPSC-relevant:** edit the prompt and the examples in `screenItem` in `scripts/run.js`.
- **Topic to GS mapping:** edit `TOPIC_GS` in `scripts/run.js`.
- **Model:** change `OLLAMA_MODEL`. A larger model such as `qwen2.5:7b` judges relevance better but is slower.
- **Another exam:** change the feeds, the prompt and the topic mapping to suit a state PSC or another exam.

## Why open models

- **Free to run:** no API key and no per-call cost, so a daily job costs nothing.
- **Private and local:** the model runs on your own machine or runner, and no reader data goes to a third party.
- **Swappable:** changing the model is a one-line change, and the model could be fine-tuned later for a specific exam style or for Hindi output.
- **Forkable:** anyone can copy the project and adapt it for their own exam or language.

## Known limitations

- A 4B model is lenient on borderline items and occasionally returns broken output. Weak or vague points do get through, and some good ones are skipped. The blocklist catches only patterns already seen.
- Summaries can contain errors, especially numbers and dates. Always check the source link.
- Some points are too short to be useful on their own. The context line is shown on the website but not in the Telegram digest.
- GS tags are a study aid, not an official classification. Real topics overlap across papers, and GS4 (ethics) is rarely tagged because news seldom maps to it.
- Wikipedia's feed leans toward Western history, so Indian historical dates are rare.
- Indian Express blocks requests from GitHub's servers (HTTP 403). Its feeds work on a home connection but not in the automated job.
- Everyone gets the same pack at the same time. There is no personalisation by subject or language yet.

## Ideas for later

- A hand-written list of Indian historical dates merged in by date
- Hindi summaries
- Reader feedback ("was this useful?") to grow the blocklist
- A larger model or a GPU runner for better judgement
- Topic and GS filters on the Telegram side

## Credits and licensing

- News points link to the original publishers. This project shows short summaries and links, not article text.
- Historical events come from Wikipedia's "On this day" feed. Wikipedia text is available under CC BY-SA.
- Model: Gemma by Google, run through Ollama
