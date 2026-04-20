const fs = require('fs');
const path = require('path');

const COOKIE_NAME = 'portfolio_auth';
const PASSCODE = process.env.PASSCODE || '2380';

function parseCookies(req) {
  const list = {};
  const header = req.headers.cookie;
  if (!header) return list;
  header.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    list[key] = decodeURIComponent(val);
  });
  return list;
}

function loginPage(error) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portfolio — Login</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #f0f2f5;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 48px 40px;
      width: 100%;
      max-width: 380px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      text-align: center;
    }
    .logo {
      width: 48px;
      height: 48px;
      background: #003087;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      font-size: 22px;
    }
    h1 {
      font-size: 20px;
      font-weight: 700;
      color: #0d1117;
      margin-bottom: 6px;
    }
    p {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 28px;
    }
    input[type="password"] {
      width: 100%;
      padding: 11px 14px;
      border: 1.5px solid ${error ? '#ef4444' : '#dde1e9'};
      border-radius: 8px;
      font-size: 15px;
      font-family: inherit;
      outline: none;
      margin-bottom: ${error ? '8px' : '16px'};
      transition: border-color 0.15s;
    }
    input[type="password"]:focus { border-color: #003087; }
    .error {
      font-size: 12px;
      color: #ef4444;
      margin-bottom: 14px;
      text-align: left;
    }
    button {
      width: 100%;
      padding: 11px;
      background: #003087;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: background 0.15s;
    }
    button:hover { background: #004ab3; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">📈</div>
    <h1>Portfolio Dashboard</h1>
    <p>Enter your passcode to continue</p>
    <form method="POST" action="/api">
      <input type="password" name="passcode" placeholder="Passcode" autofocus autocomplete="current-password" />
      ${error ? '<div class="error">Incorrect passcode. Please try again.</div>' : ''}
      <button type="submit">Unlock</button>
    </form>
  </div>
</body>
</html>`;
}

module.exports = async (req, res) => {
  // Handle POST — passcode submission
  if (req.method === 'POST') {
    let body = '';
    await new Promise(resolve => {
      req.on('data', chunk => { body += chunk; });
      req.on('end', resolve);
    });
    const params = new URLSearchParams(body);
    const submitted = params.get('passcode');

    if (submitted === PASSCODE) {
      // Set auth cookie (session-length, httpOnly, secure)
      res.setHeader('Set-Cookie', `${COOKIE_NAME}=${PASSCODE}; Path=/; HttpOnly; Secure; SameSite=Strict`);
      res.writeHead(302, { Location: '/' });
      res.end();
      return;
    } else {
      res.writeHead(401, { 'Content-Type': 'text/html' });
      res.end(loginPage(true));
      return;
    }
  }

  // Check auth cookie
  const cookies = parseCookies(req);
  if (cookies[COOKIE_NAME] === PASSCODE) {
    // Serve the dashboard
    const htmlPath = path.join(process.cwd(), 'public', 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  // Not authenticated — show login
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(loginPage(false));
};
