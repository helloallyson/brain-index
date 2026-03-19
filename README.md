# Ally's Brain Index 🧠

A personal encyclopedia of rabbit holes, creative projects, deep dives, and random knowledge.

## Quick Deploy to Netlify

### Option 1: Git + Auto-Deploy (Recommended)

1. Push this folder to a new GitHub repo
2. Go to [app.netlify.com](https://app.netlify.com) > "Add new site" > "Import an existing project"
3. Connect your GitHub repo
4. Netlify auto-detects the build settings from `netlify.toml`
5. Add your API key (see below)
6. Hit Deploy!

### Option 2: Manual Deploy

1. Open a terminal in this folder
2. Run: `npm install`
3. Run: `npm run build`
4. Drag the `dist` folder into Netlify Deploys
5. **Note:** The AI "Add Topic" feature won't work with drag-deploy because it needs the serverless function. Use Option 1 for full functionality.

## Setting Up the AI Feature

The "Add Topic" button uses Claude to auto-generate encyclopedia entries. To make it work:

1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
2. In Netlify: Go to Site Settings > Environment Variables
3. Add: `ANTHROPIC_API_KEY` = your key
4. Redeploy

Without the API key, everything else works -- you just can't auto-generate new topics.

## Project Structure

```
encyclopedia-site/
  index.html              <- Entry point
  netlify.toml            <- Netlify build config
  package.json            <- Dependencies
  vite.config.js          <- Vite bundler config
  src/
    main.jsx              <- React entry
    App.jsx               <- The entire encyclopedia app
  netlify/
    functions/
      generate-topic.mjs  <- Serverless function for AI calls
```

## Local Development

```bash
npm install
npm run dev
```

Opens at http://localhost:5173

Note: The AI add-topic feature needs `netlify dev` instead of `npm run dev` to run the serverless function locally:

```bash
npm install -g netlify-cli
netlify dev
```

## How It Works

- 25 seed topics are baked into the code (the originals from our conversations)
- Custom topics you add via the + button are saved in localStorage
- The AI feature calls a Netlify serverless function which calls the Anthropic API
- Your API key never touches the browser -- it stays server-side
