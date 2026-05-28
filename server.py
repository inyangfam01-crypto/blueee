#!/usr/bin/env python3
"""
Blueee - Universal AI Provider Connector
A local proxy server with web UI for connecting Claude Code to any AI provider.
"""

import http.server
import socketserver
import json
import os
import sys
import webbrowser
import socket
from urllib.parse import urlparse, parse_qs
import base64

PORT = 8080
CONFIG_FILE = "config.json"

# AI Providers configuration
PROVIDERS = {
    "1": {"name": "BluesMinds", "base_url": "https://api.bluesminds.com/v1", "models": ["bluesminds-pro", "bluesminds-max"]},
    "2": {"name": "Nvidia NIM", "base_url": "https://integrate.api.nvidia.com/v1", "models": ["nvidia/llama-3.1-nemotron-70b-instruct", "nvidia/llama-3.1-405b-instruct"]},
    "3": {"name": "Google Gemini", "base_url": "https://generativelanguage.googleapis.com/v1beta", "models": ["gemini-2.0-flash-exp", "gemini-1.5-pro"]},
    "4": {"name": "Grok / xAI", "base_url": "https://api.x.ai/v1", "models": ["grok-2-1212", "grok-2"]},
    "5": {"name": "Cerebras", "base_url": "https://api.cerebras.ai/v1", "models": ["llama-3.3-70b", "qwen-2.5-72b"]},
    "6": {"name": "Mistral", "base_url": "https://api.mistral.ai/v1", "models": ["mistral-large-latest", "codestral-latest"]},
}

def load_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r") as f:
            return json.load(f)
    return {}

def save_config(config):
    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f, indent=2)

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip

HTML_PAGE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blueee - AI Provider Setup</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 { color: #1a1a2e; margin-bottom: 10px; font-size: 28px; }
        .subtitle { color: #666; margin-bottom: 30px; }
        label { display: block; margin-bottom: 8px; color: #333; font-weight: 600; }
        select, input {
            width: 100%;
            padding: 14px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 16px;
            margin-bottom: 20px;
            transition: border-color 0.3s;
        }
        select:focus, input:focus {
            outline: none;
            border-color: #4f46e5;
        }
        button {
            width: 100%;
            padding: 16px;
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(79, 70, 229, 0.4);
        }
        .success {
            background: #d1fae5;
            color: #065f46;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        .info-box {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
        }
        .info-box code {
            background: #e5e7eb;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 14px;
        }
        .info-box pre {
            background: #1a1a2e;
            color: #10b981;
            padding: 15px;
            border-radius: 8px;
            overflow-x: auto;
            margin-top: 10px;
            font-size: 13px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Blueee</h1>
        <p class="subtitle">Universal AI Provider Connector</p>
        
        {{SUCCESS}}
        
        <form id="setupForm">
            <label>Select AI Provider</label>
            <select id="provider" name="provider" required>
                <option value="">Choose a provider...</option>
                <option value="1">BluesMinds</option>
                <option value="2">Nvidia NIM</option>
                <option value="3">Google Gemini</option>
                <option value="4">Grok / xAI</option>
                <option value="5">Cerebras</option>
                <option value="6">Mistral</option>
            </select>
            
            <label>API Key</label>
            <input type="password" id="apiKey" name="apiKey" placeholder="Paste your API key here" required>
            
            <label>Server Port (default: 8080)</label>
            <input type="number" id="port" name="port" value="8080" min="1024" max="65535">
            
            <button type="submit">Save & Start</button>
        </form>
        
        <div class="info-box">
            <strong>📋 Claude Code Setup:</strong>
            <pre>export ANTHROPIC_API_KEY=sk-dummy
export ANTHROPIC_BASE_URL=http://{{IP}}:8080
claude --model claude-3-5-sonnet-20241022</pre>
        </div>
    </div>
    
    <script>
        document.getElementById('setupForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);
            
            await fetch('/save', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
            
            location.reload();
        });
    </script>
</body>
</html>
"""

class BlueeeHandler(http.server.BaseHTTPRequestHandler):
    config = {}
    
    def do_GET(self):
        parsed = urlparse(self.path)
        
        if parsed.path == "/" or parsed.path == "/index.html":
            self.send_response(200)
            self.send_header("Content-type", "text/html")
            self.end_headers()
            
            config = load_config()
            success_html = ""
            if config.get("provider"):
                provider_name = PROVIDERS.get(config.get("provider", ""), {}).get("name", "Unknown")
                success_html = f'<div class="success">✅ Connected to {provider_name}</div>'
            
            html = HTML_PAGE.replace("{{SUCCESS}}", success_html).replace("{{IP}}", get_local_ip())
            self.wfile.write(html.encode())
        
        elif parsed.path == "/config":
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(load_config()).encode())
        
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_POST(self):
        parsed = urlparse(self.path)
        
        if parsed.path == "/save":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            data = json.loads(body)
            
            provider = PROVIDERS.get(data.get("provider", ""))
            if provider:
                config = {
                    "provider": data["provider"],
                    "provider_name": provider["name"],
                    "base_url": provider["base_url"],
                    "api_key": data["apiKey"],
                    "port": int(data.get("port", 8080))
                }
                save_config(config)
                
                self.send_response(200)
                self.send_header("Content-type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "ok"}).encode())
            else:
                self.send_response(400)
                self.end_headers()
        
        else:
            # Proxy request to AI provider
            self.proxy_request()
    
    def proxy_request(self):
        config = load_config()
        if not config.get("api_key"):
            self.send_response(401)
            self.end_headers()
            self.wfile.write(b"API key not configured")
            return
        
        # Read request body
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length) if length > 0 else b""
        
        # Forward to AI provider
        import urllib.request
        import urllib.error
        
        url = config["base_url"] + self.path
        req = urllib.request.Request(url, data=body, method="POST")
        req.add_header("Content-Type", "application/json")
        req.add_header("Authorization", f"Bearer {config['api_key']}")
        
        # Copy other headers
        for header in ["anthropic-version", "anthropic-beta"]:
            val = self.headers.get(header)
            if val:
                req.add_header(header, val)
        
        try:
            response = urllib.request.urlopen(req, timeout=60)
            self.send_response(response.status)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(response.read())
        except urllib.error.HTTPError as e:
            self.send_response(e.code)
            self.end_headers()
            self.wfile.write(e.read())
        except Exception as e:
            self.send_response(502)
            self.end_headers()
            self.wfile.write(str(e).encode())

def main():
    global PORT
    
    config = load_config()
    if config.get("port"):
        PORT = config["port"]
    
    # Open browser
    webbrowser.open(f"http://localhost:{PORT}")
    
    with socketserver.TCPServer(("", PORT), BlueeeHandler) as httpd:
        local_ip = get_local_ip()
        print(f"\n🚀 Blueee server running!")
        print(f"   Local:   http://localhost:{PORT}")
        print(f"   Network: http://{local_ip}:{PORT}")
        print(f"\n📋 Claude Code commands:")
        print(f"   export ANTHROPIC_API_KEY=sk-dummy")
        print(f"   export ANTHROPIC_BASE_URL=http://localhost:{PORT}")
        print(f"\n🌐 Open http://localhost:{PORT} in your browser to configure\n")
        httpd.serve_forever()

if __name__ == "__main__":
    main()