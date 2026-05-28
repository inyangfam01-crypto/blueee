#!/usr/bin/env node

const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');

// ANSI Colors
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const MAGENTA = '\x1b[35m';
const BOLD = '\x1b[1m';
const NC = '\x1b[0m';

// Config file path
const CONFIG_FILE = path.join(__dirname, 'config.json');

// Provider configurations
const PROVIDERS = {
  1: { name: 'BluesMinds', baseUrl: 'https://api.bluesminds.com/v1', auth: 'bearer' },
  2: { name: 'Nvidia NIM', baseUrl: 'https://integrate.api.nvidia.com/v1', auth: 'bearer' },
  3: { name: 'Google Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', auth: 'query' },
  4: { name: 'Grok / xAI', baseUrl: 'https://api.x.ai/v1', auth: 'bearer' },
  5: { name: 'Cerebras', baseUrl: 'https://api.cerebras.ai/v1', auth: 'bearer' },
  6: { name: 'Mistral', baseUrl: 'https://api.mistral.ai/v1', auth: 'bearer' }
};

// Load or create config
function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  }
  return null;
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// Print banner
function printBanner() {
  console.log(`${CYAN}${BOLD}
  ██████╗ ██████╗ ███████╗██╗   ██╗    ██╗   ██╗██████╗ 
 ██╔════╝██╔═══██╗██╔════╝██║   ██║    ██║   ██║██╔══██╗
 ██║     ██║   ██║█████╗  ██║   ██║    ██║   ██║██████╔╝
 ██║     ██║   ██║██╔══╝  ██║   ██║    ██║   ██║██╔══██╗
 ╚██████╗╚██████╔╝██║     ╚██████╔╝    ╚██████╔╝██║  ██║
  ╚═════╝ ╚═════╝ ╚═╝      ╚═════╝      ╚═════╝ ╚═╝  ╚═╝
${NC}  ${MAGENTA}Universal AI Connector for Claude Code${NC}
`);
}

// Print menu
function printMenu() {
  console.log(`${BOLD}Select your AI Provider:${NC}`);
  console.log('');
  for (const [num, provider] of Object.entries(PROVIDERS)) {
    console.log(`  [${num}] ${provider.name.padEnd(15)} (${provider.baseUrl.replace('https://', '')})`);
  }
  console.log('');
}

// Setup function
async function setup() {
  printBanner();
  printMenu();

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (q) => new Promise((resolve) => readline.question(q, resolve));

  // Get provider selection
  let choice = await question('Enter your choice [1-6]: ');
  while (!PROVIDERS[choice]) {
    choice = await question('Invalid choice. Enter [1-6]: ');
  }

  const provider = PROVIDERS[choice];

  // Get API key
  const apiKey = await question(`Enter your ${provider.name} API Key: `);
  while (!apiKey.trim()) {
    console.log(`${RED}✗ API Key cannot be empty${NC}`);
    return readline.close();
  }

  // Get port
  const portInput = await question('Enter port [default: 8080]: ');
  const port = parseInt(portInput) || 8080;

  // Save config
  const config = {
    provider: provider.name,
    baseUrl: provider.baseUrl,
    apiKey: apiKey,
    auth: provider.auth,
    port: port
  };
  saveConfig(config);

  console.log(`${GREEN}✓ Configuration saved!${NC}`);
  console.log('');
  console.log(`${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}`);
  console.log(`  ${BOLD}Provider${NC}  : ${provider.name}`);
  console.log(`  ${BOLD}Port${NC}     : ${port}`);
  console.log(`  ${BOLD}Endpoint${NC} : http://localhost:${port}`);
  console.log(`${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}`);
  console.log('');
  console.log(`${YELLOW}To connect Claude Code:${NC}`);
  console.log(`  export ANTHROPIC_API_KEY=sk-dummy`);
  console.log(`  export ANTHROPIC_BASE_URL=http://localhost:${port}`);
  console.log(`  claude --model <model-name>`);
  console.log('');

  readline.close();
  startServer(config);
}

// Proxy request to AI provider
function proxyRequest(config, req, res) {
  const parsedUrl = url.parse(req.url, true);
  const targetPath = parsedUrl.path;
  
  // Build headers
  const headers = { ...req.headers };
  delete headers['host'];
  
  if (config.auth === 'bearer') {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  // Build target URL
  let targetUrl;
  if (config.auth === 'query') {
    targetUrl = `${config.baseUrl}${targetPath}&key=${config.apiKey}`;
  } else {
    targetUrl = `${config.baseUrl}${targetPath}`;
  }

  const options = {
    hostname: url.parse(targetUrl).hostname,
    port: 443,
    path: url.parse(targetUrl).path,
    method: req.method,
    headers: headers
  };

  const proxyReq = https.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error(`${RED}✗ Proxy error: ${err.message}${NC}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  });

  req.pipe(proxyReq, { end: true });
}

// Start server
function startServer(config) {
  const server = http.createServer((req, res) => {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    proxyRequest(config, req, res);
  });

  server.listen(config.port, '0.0.0.0', () => {
    console.log(`${GREEN}✓ Blueee server running on http://0.0.0.0:${config.port}${NC}`);
    console.log(`${CYAN}Ready to accept Claude Code connections!${NC}`);
  });
}

// Main
const args = process.argv.slice(2);
if (args[0] === 'setup') {
  setup();
} else if (args[0] === 'start') {
  const config = loadConfig();
  if (!config) {
    console.log(`${RED}✗ No configuration found. Run: node server.js setup${NC}`);
    process.exit(1);
  }
  startServer(config);
} else if (args[0] === 'status') {
  const config = loadConfig();
  if (config) {
    console.log(`${GREEN}✓ Config loaded:${NC}`);
    console.log(`  Provider: ${config.provider}`);
    console.log(`  Port: ${config.port}`);
    console.log(`  Endpoint: http://localhost:${config.port}`);
  } else {
    console.log(`${RED}✗ No configuration found. Run: node server.js setup${NC}`);
  }
} else {
  console.log(`${BOLD}Blueee - Universal AI Connector${NC}`);
  console.log('');
  console.log(`  ${CYAN}setup${NC}   - Configure provider and API key`);
  console.log(`  ${CYAN}start${NC}   - Start the proxy server`);
  console.log(`  ${CYAN}status${NC}  - Show current configuration`);
  console.log('');
  console.log(`  ${YELLOW}Usage:${NC}`);
  console.log(`    node server.js setup`);
  console.log(`    node server.js start`);
}