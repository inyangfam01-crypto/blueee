# Blueee 🌊

Universal AI Connector for Claude Code — runs locally with a web UI for easy setup.

## Quick Start

```bash
git clone https://github.com/inyangfam01-crypto/blueee.git
cd blueee
node server.js
```

That's it! The server will:
1. Start automatically
2. Open your browser to the setup page
3. Enter your API key and select your AI provider

## Features

- 🌐 **Web UI Setup** — No CLI prompts, just fill out a form in your browser
- 🔄 **Multi-Provider Support** — Connect to:
  - BluesMinds
  - Nvidia NIM
  - Google Gemini
  - Grok / xAI
  - Cerebras
  - Mistral
- 📱 **Local Network Access** — Access via `http://localhost:8080` or your IP address
- 🔒 **Local Storage** — Your API keys stay on your machine

## Usage with Claude Code

After setup, in another terminal:

```bash
export ANTHROPIC_API_KEY=sk-dummy
export ANTHROPIC_BASE_URL=http://localhost:8080
claude --model claude-3-5-sonnet-20241022
```

## Access from Other Devices

Find your local IP:
```bash
hostname -I | awk '{print $1}'
```

Then use:
```bash
export ANTHROPIC_BASE_URL=http://192.168.1.X:8080
```

## Reconfigure

Just open `http://localhost:8080` in your browser to change provider or API key.

## Troubleshooting

**Port already in use:**
```bash
# Kill existing process
lsof -ti:8080 | xargs kill -9
# Or change port in the web form
```

**Browser doesn't open automatically:**
```bash
node server.js
# Then manually open http://localhost:8080
```