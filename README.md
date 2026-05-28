# Blueee

**Universal AI Connector for Claude Code**

Run your own local AI proxy server and connect Claude Code to any AI provider.

## Install

```bash
# Clone the repo
git clone https://github.com/inyangfam01-crypto/blueee.git
cd blueee

# Install dependencies (if any)
npm install
```

## Quick Start

```bash
# 1. Setup - choose your provider and enter API key
node server.js setup

# 2. Start the server
node server.js start

# 3. Connect Claude Code
# In another terminal:
export ANTHROPIC_API_KEY=sk-dummy
export ANTHROPIC_BASE_URL=http://localhost:8080
claude --model <model-name>
```

Or use npm scripts:
```bash
npm run setup
npm start
```

## Supported Providers

| # | Provider | Endpoint |
|---|----------|----------|
| 1 | BluesMinds | api.bluesminds.com |
| 2 | Nvidia NIM | integrate.api.nvidia.com |
| 3 | Google Gemini | generativelanguage.googleapis.com |
| 4 | Grok / xAI | api.x.ai |
| 5 | Cerebras | api.cerebras.ai |
| 6 | Mistral | api.mistral.ai |

## Requirements

- Node.js 18+
- Claude Code CLI (`npm install -g @anthropic-ai/claude-code`)

## How It Works

1. **Blueee** runs as a local HTTP server
2. You configure it with your AI provider and API key
3. Claude Code connects to Blueee (localhost)
4. Blueee proxies requests to your chosen AI provider, injecting your API key

## Commands

```bash
node server.js setup   # Configure provider and API key
node server.js start   # Start the proxy server
node server.js status  # Show current configuration
```

## Access via IP

The server binds to `0.0.0.0` so you can access it via your local IP:

```bash
# Find your IP
hostname -I | awk '{print $1}'

# Use in Claude Code
export ANTHROPIC_BASE_URL=http://YOUR_IP:8080
```

## License

MIT