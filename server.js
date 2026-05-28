const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// ANSI Colors
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
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
  ██████╗ ███████╗███████╗██╗     ██╗███╗   ██╗███████╗
  ██╔══██╗██╔════╝██╔════╝██║     ██║████╗  ██║██╔════╝
  ██║  ██║█████╗  █████╗  ██║     ██║██╔██╗ ██║█████╗  
  ██║  ██║██╔══╝  ██╔══╝  ██║     ██║██║╚██╗██║██╔══╝  
  ██████╔╝███████╗███████╗███████╗██║██║ ╚████║███████╗
  ╚═════╝ ╚══════╝╚══════╝╚══════╝╚═╝╚═╝  ╚═══╝╚══════╝
  ${NC}${GREEN}Universal AI Connector for Claude Code${NC}
  `);
}

// HTML for the web form
function getHtmlForm(config = null) {
  const providersHtml = Object.entries(PROVIDERS).map(([num, p]) => {
    const selected = config?.provider == num ? 'selected' : '';
    return `<option value="${num}" ${selected}>${p.name}</option>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <title>Blueee Setup</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .container { background: white; border-radius: 16px; padding: 40px; width: 100%; max-width: 500px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
    h1 { color: #1a1a2e; margin-bottom: 8px; font-size: 28px; }
    .subtitle { color: #666; margin-bottom: 32px; font-size: 14px; }
    label { display: block; margin-bottom: 8px; color: #333; font-weight: 600; font-size: 14px; }
    select, input { width: 100%; padding: 14px 16px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 16px; margin-bottom: 20px; transition: border-color 0.2s; }
    select:focus, input:focus { outline: none; border-color: #4f46e5; }
    button { width: 100%; padding: 16px; background: #4f46e5; color: white; border: none; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
    button:hover { background: #4338ca; }
    .info { background: #f3f4f6; padding: 16px; border-radius: 10px; margin-bottom: 20px; }
    .info h3 { font-size: 14px; color: #333; margin-bottom: 8px; }
    .info code { background: #e5e7eb; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
    .success { background: #d1fae5; color: #065f46; padding: 16px; border-radius: 10px; margin-bottom: 20px; display: none; }
    .error { background: #fee2e2; color: #991b1b; padding: 16px; border-radius: 10px; margin-bottom: 20px; display: none; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 Blueee Setup</h1>
    <p class="subtitle">Universal AI Connector for Claude Code</p>
    
    <div class="success" id="success">✓ Configuration saved! Server running on port ${config?.port || 8080}</div>
    <div class="error" id="error"></div>
    
    <form id="setupForm">
      <label>Select AI Provider</label>
      <select name="provider" required>
        ${providersHtml}
      </select>
      
      <label>API Key</label>
      <input type="password" name="apiKey" placeholder="Paste your API key here" required>
      
      <label>Port (default: 8080)</label>
      <input type="number" name="port" value="${config?.port || 8080}" min="1024" max="65535">
      
      <button type="submit">Save & Start Server</button>
    </form>
    
    <div class="info">
      <h3>📋 How to use with Claude Code:</h3>
      <p style="margin-top: 12px; font-size: 13px; color: #555;">
        <code>export ANTHROPIC_API_KEY=sk-dummy</code><br>
        <code>export ANTHROPIC_BASE_URL=http://localhost:${config?.port || 8080}</code>
      </p>
    </div>
  </div>
  
  <script>
    document.getElementById('setupForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = {
        provider: formData.get('provider'),
        apiKey: formData.get('apiKey'),
        port: parseInt(formData.get('port'))
      };
      
      const res = await fetch('/save', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
      });
      
      const result = await res.json();
      if (result.success) {
        document.getElementById('success').style.display = 'block';
        document.getElementById('error').style.display = 'none';
      } else {
        document.getElementById('error').textContent = result.error;
        document.getElementById('error').style.display = 'block';
      }
    });
  </script>
</body>
</html>`;
}

// Proxy request to AI provider
function proxyRequest(req, res, config) {
  const provider = PROVIDERS[config.provider];
  if (!provider) return;

  const targetUrl = provider.baseUrl + req.url;
  const headers = { ...req.headers };
  delete headers.host;

  if (provider.auth === 'bearer') {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  } else if (provider.auth === 'query') {
    const u = new URL(targetUrl);
    u.searchParams.set('key', config.apiKey);
    req.url = u.pathname + u.search;
  }

  const proxyReq = (provider.baseUrl.startsWith('https') ? https : http).request({
    hostname: new URL(provider.baseUrl).hostname,
    port: provider.baseUrl.startsWith('https') ? 443 : 80,
    path: req.url,
    method: req.method,
    headers
  }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  req.pipe(proxyReq, { end: true });
}

// HTTP Server
let server;

function startServer(config) {
  server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    
    // Save config endpoint
    if (parsedUrl.pathname === '/save' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const newConfig = {
            provider: data.provider,
            apiKey: data.apiKey,
            port: data.port
          };
          saveConfig(newConfig);
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({success: true}));
          
          // Restart server on new port
          if (server) server.close();
          startServer(newConfig);
        } catch (e) {
          res.writeHead(400, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({error: e.message}));
        }
      });
      return;
    }
    
    // Serve form
    if (parsedUrl.pathname === '/' || parsedUrl.pathname === '/index.html') {
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(getHtmlForm(config));
      return;
    }
    
    // Proxy to AI provider
    if (config && config.apiKey) {
      proxyRequest(req, res, config);
    } else {
      res.writeHead(302, {'Location': '/'});
      res.end();
    }
  });

  server.listen(config.port, '0.0.0.0', () => {
    const ip = Object.values(require('os').networkInterfaces())
      .flat().find(i => i.family === 'IPv4' && !i.internal)?.address || 'localhost';
    
    console.log(`${GREEN}✓ Blueee server running on http://localhost:${config.port}${NC}`);
    console.log(`${GREEN}✓ Access via IP: http://${ip}:${config.port}${NC}`);
    console.log(`${YELLOW}\n📋 Claude Code setup:${NC}`);
    console.log(`  export ANTHROPIC_API_KEY=sk-dummy`);
    console.log(`  export ANTHROPIC_BASE_URL=http://localhost:${config.port}`);
  });
}

// Auto-open browser
function openBrowser(port) {
  const ip = Object.values(require('os').networkInterfaces())
    .flat().find(i => i.family === 'IPv4' && !i.internal)?.address || 'localhost';
  const addr = `http://localhost:${port}`;
  
  console.log(`${CYAN}Opening browser...${NC}`);
  
  if (process.platform === 'darwin') {
    exec(`open ${addr}`);
  } else if (process.platform === 'win32') {
    exec(`start ${addr}`);
  } else {
    exec(`xdg-open ${addr} || firefox ${addr} || chromium ${addr}`);
  }
}

// Main
printBanner();

const config = loadConfig();
if (config) {
  console.log(`${GREEN}✓ Config found, starting server...${NC}\n`);
  startServer(config);
} else {
  console.log(`${YELLOW}⚠ No config found, showing setup form...${NC}\n`);
  startServer({ port: 8080 });
  setTimeout(() => openBrowser(8080), 1500);
}
