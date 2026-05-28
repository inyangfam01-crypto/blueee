# Blueee - Universal AI Provider Connector

A local proxy server with web UI for connecting Claude Code to any AI provider.

## Quick Start

```bash
# Clone
git clone https://github.com/inyangfam01-crypto/blueee.git
cd blueee

# Run
python3 server.py
```

That's it! The server will:
1. Start automatically
2. Open your browser to the setup page
3. Select your AI provider and enter your API key
4. Connect Claude Code

## Usage

After setup, connect Claude Code:

```bash
export ANTHROPIC_API_KEY=sk-dummy
export ANTHROPIC_BASE_URL=http://localhost:8080
claude --model claude-3-5-sonnet-20241022
```

Or via IP (from another device):

```bash
export ANTHROPIC_BASE_URL=http://192.168.1.X:8080
```

## Supported Providers

- BluesMinds
- Nvidia NIM
- Google Gemini
- Grok / xAI
- Cerebras
- Mistral

## Requirements

- Python 3.7+
- No external dependencies (uses built-in libraries)

## Reconfigure

Just run `python3 server.py` again and visit the URL to change settings.