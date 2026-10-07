# STAA Assistant — AI upgrade (optional)

The chat assistant on the website works without this folder. On its own, it matches visitors' questions against the FAQs in `assets/data/faq.json` and sends anything it can't answer to WhatsApp.

This folder contains a small **Cloudflare Worker** that lets the assistant answer in natural language with Claude, Anthropic's AI model. The worker is needed because the Anthropic API key must stay secret, and a static site like GitHub Pages can't hide it.

How it behaves once switched on:

- It answers only from `assets/data/faq.json`, the same file the website uses, so there is still only one knowledge base to maintain.
- It replies in English or Swahili, matching the visitor.
- It won't make up fees, office hours, tax rates or deadlines. For those, for advice about a visitor's own situation, and for anything unrelated to STAA, it shows the **Continue on WhatsApp** button.
- If the worker is down or out of credit, the website silently falls back to the built-in FAQ answers.

## What you need

- An Anthropic API key from [console.anthropic.com](https://console.anthropic.com). Usage is pay-as-you-go: with the model set in `src/index.js` (Claude Opus 5.5), a typical question costs around 1–2 US cents. Set a monthly spend limit in the Anthropic Console.
- A free Cloudflare account ([dash.cloudflare.com](https://dash.cloudflare.com)).
- Node.js installed on your computer.

## Set it up (about 10 minutes)

Run these in a terminal, from this `ai-assistant` folder:

```
npm install
npx wrangler login
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler deploy
```

- `wrangler login` opens your browser so you can sign in to Cloudflare.
- `secret put` asks you to paste your API key. It's stored encrypted by Cloudflare, never in the code.
- `deploy` prints your worker's address, something like `https://staa-assistant.<your-name>.workers.dev`.

Then switch the website over:

1. Open `assets/js/assistant.js` and paste that address into `AI_ENDPOINT` near the top:
   `var AI_ENDPOINT = 'https://staa-assistant.<your-name>.workers.dev';`
2. In `privacy.html`, keep the sentence about AI answers (look for the REPLACE comment).
3. Commit and push. The live site now uses AI answers.

## Allowed websites

The worker only answers requests from the sites listed in `ALLOWED_ORIGINS` in `wrangler.toml`: your GitHub Pages address and staa.co.tz. To test with VS Code Live Server, add `http://127.0.0.1:5500` to the list and run `npx wrangler deploy` again.

## Day to day

- **Change answers:** edit `assets/data/faq.json`, then run `npx wrangler deploy` here so the AI picks up the changes. The non-AI fallback updates as soon as you push.
- **Change the assistant's rules or tone:** edit the `SYSTEM` text in `src/index.js` and redeploy.
- **See errors:** run `npx wrangler tail` to watch live logs.
- **Limit abuse:** in the Cloudflare dashboard, add a rate-limiting rule for the worker, for example 20 requests per minute per visitor.
- **Turn AI off:** set `AI_ENDPOINT` back to `''` in `assistant.js` and push.
