# Blueee

Universal AI Provider Connector for Claude Code

## Install

```bash
curl -fsSL https://raw.githubusercontent.com/inyangfam01-crypto/blueee/main/setup.sh | bash
```

## Supported Providers

- **BluesMinds** - api.bluesminds.com
- **Nvidia NIM** - integrate.api.nvidia.com
- **Google Gemini** - generativelanguage.googleapis.com
- **Grok / xAI** - api.x.ai
- **Cerebras** - api.cerebras.ai
- **Mistral** - api.mistral.ai

## Requirements

- curl
- jq
- Node.js
- Claude Code CLI (`npm install -g @anthropic-ai/claude-code`)

## What It Does

Blueee connects Claude Code to alternative AI providers, letting you use models from BluesMinds, Nvidia, Google, xAI, Cerebras, or Mistral instead of Anthropic's default API.

Select your provider, enter your API key, pick a model — and Blueee configures Claude Code to use it automatically.