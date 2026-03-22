import type { Request, Response } from 'express'
import express from 'express'

const router = express.Router()

/**
 * @route GET /api/docs
 * @desc Interactive HTML API Documentation
 */
router.get('/', (_req: Request, res: Response) => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:4001'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ZURL API Documentation</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@700;900&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    :root{
      --bg:#0d0d0d;--card:#141414;--border:#222;
      --text:#eee;--muted:#888;--accent:#ffe0c2;--accent-fg:#1a0e08;
      --red:#f87171;--green:#86efac;
    }
    html{scroll-behavior:smooth}
    body{background:var(--bg);color:var(--text);font-family:'Inter',sans-serif;line-height:1.6;min-height:100vh}
    a{color:var(--accent);text-decoration:none}
    a:hover{text-decoration:underline}

    /* Layout */
    .layout{display:grid;grid-template-columns:260px 1fr;min-height:100vh}
    .sidebar{position:sticky;top:0;height:100vh;overflow-y:auto;background:#0a0a0a;border-right:1px solid var(--border);padding:36px 24px;display:flex;flex-direction:column;gap:6px}
    .sid-brand{font-family:'Space Grotesk',sans-serif;font-size:22px;font-weight:900;letter-spacing:-.04em;color:var(--accent);margin-bottom:8px}
    .sid-version{font-size:10px;font-weight:700;color:var(--muted);letter-spacing:.15em;margin-bottom:28px;text-transform:uppercase}
    .sid-group{font-size:9px;font-weight:900;letter-spacing:.18em;color:var(--muted);text-transform:uppercase;padding:16px 0 6px}
    .sid-link{display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;font-size:13px;font-weight:600;color:var(--muted);transition:.15s;border:none;background:none;cursor:pointer;width:100%;text-align:left;text-decoration:none}
    .sid-link:hover{background:rgba(255,255,255,.04);color:var(--text)}
    .sid-link .badge{font-size:9px;font-weight:900;padding:2px 7px;border-radius:4px;letter-spacing:.05em}
    .badge-post{background:rgba(134,239,172,.12);color:var(--green)}
    .badge-get{background:rgba(96,165,250,.12);color:#93c5fd}
    .badge-del{background:rgba(248,113,113,.12);color:var(--red)}
    .badge-patch{background:rgba(251,191,36,.12);color:#fcd34d}

    /* Main */
    .main{padding:60px clamp(24px,5vw,80px) 120px}
    .section{max-width:860px;margin-bottom:80px}
    .section-title{font-family:'Space Grotesk',sans-serif;font-size:28px;font-weight:900;letter-spacing:-.03em;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid var(--border)}
    .intro-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:40px}
    .info-card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:24px}
    .info-card h4{font-size:11px;font-weight:900;color:var(--muted);letter-spacing:.12em;text-transform:uppercase;margin-bottom:10px}
    .info-card code{font-family:'JetBrains Mono',monospace;font-size:13px;color:var(--accent)}

    /* Endpoints */
    .endpoint{background:var(--card);border:1px solid var(--border);border-radius:20px;overflow:hidden;margin-bottom:24px}
    .ep-header{display:flex;align-items:center;gap:14px;padding:20px 24px;cursor:pointer;user-select:none;transition:.15s}
    .ep-header:hover{background:rgba(255,255,255,.02)}
    .ep-method{font-size:11px;font-weight:900;padding:5px 10px;border-radius:6px;letter-spacing:.06em;min-width:60px;text-align:center}
    .ep-path{font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:600;flex:1}
    .ep-desc{font-size:13px;color:var(--muted);margin-left:auto}
    .ep-body{padding:0 24px 24px;border-top:1px solid var(--border);display:none}
    .ep-body.open{display:block;padding-top:20px}
    .param-table{width:100%;border-collapse:collapse;margin:12px 0}
    .param-table th{font-size:10px;font-weight:900;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;padding:8px 12px;text-align:left;border-bottom:1px solid var(--border)}
    .param-table td{padding:10px 12px;font-size:13px;border-bottom:1px solid rgba(255,255,255,.04);vertical-align:top}
    .param-table td:first-child{font-family:'JetBrains Mono',monospace;color:var(--accent);font-size:12px}
    .param-table td:nth-child(2){color:#93c5fd;font-size:12px;font-family:'JetBrains Mono',monospace}
    .required{color:var(--red);font-size:10px;font-weight:800;margin-left:4px}
    pre{background:#080808;border:1px solid var(--border);border-radius:12px;padding:20px;font-family:'JetBrains Mono',monospace;font-size:13px;color:#d4d4d8;overflow-x:auto;line-height:1.6}
    pre .key{color:#93c5fd}
    pre .val{color:#86efac}
    pre .str{color:#fca5a5}
    .sub-title{font-size:11px;font-weight:900;color:var(--muted);text-transform:uppercase;letter-spacing:.12em;margin:20px 0 8px}
    .auth-badge{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:800;padding:4px 10px;border-radius:6px;background:rgba(255,224,194,.08);color:var(--accent);border:1px solid rgba(255,224,194,.15)}

    /* Code tabs */
    .tabs{display:flex;gap:0;border-bottom:1px solid var(--border);margin-bottom:0}
    .tab{padding:10px 18px;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;border:none;background:none;color:var(--muted);border-bottom:2px solid transparent;transition:.15s}
    .tab.active{color:var(--accent);border-bottom-color:var(--accent)}
    .snippet{display:none}.snippet.active{display:block}

    /* Hero */
    .hero{padding:0 0 60px}
    .hero h1{font-family:'Space Grotesk',sans-serif;font-size:clamp(36px,5vw,56px);font-weight:900;letter-spacing:-.04em;margin-bottom:16px}
    .hero h1 span{color:var(--accent)}
    .hero p{font-size:17px;color:var(--muted);max-width:560px;line-height:1.7}
    .hero-chips{display:flex;gap:12px;flex-wrap:wrap;margin-top:24px}
    .chip{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:50px;border:1px solid var(--border);font-size:12px;font-weight:700;color:var(--muted);background:var(--card)}

    @media(max-width:720px){.layout{grid-template-columns:1fr}.sidebar{display:none}.intro-grid{grid-template-columns:1fr}}
  </style>
</head>
<body>
<div class="layout">

  <!-- SIDEBAR -->
  <nav class="sidebar">
    <div class="sid-brand">ZURL</div>
    <div class="sid-version">API Reference · v1.0</div>
    <a class="sid-link" href="#intro">Overview</a>
    <a class="sid-link" href="#auth">Authentication</a>
    <div class="sid-group">URLs</div>
    <a class="sid-link" href="#url-create"><span class="badge badge-post">POST</span> Create URL</a>
    <a class="sid-link" href="#url-list"><span class="badge badge-get">GET</span> List URLs</a>
    <a class="sid-link" href="#url-delete"><span class="badge badge-del">DEL</span> Delete URL</a>
    <div class="sid-group">Analytics</div>
    <a class="sid-link" href="#analytics"><span class="badge badge-get">GET</span> URL Analytics</a>
    <div class="sid-group">Bio Pages</div>
    <a class="sid-link" href="#bio-get"><span class="badge badge-get">GET</span> Get Bio Page</a>
    <div class="sid-group">API Keys</div>
    <a class="sid-link" href="#keys-list"><span class="badge badge-get">GET</span> List Keys</a>
    <a class="sid-link" href="#keys-create"><span class="badge badge-post">POST</span> Create Key</a>
    <a class="sid-link" href="#keys-delete"><span class="badge badge-del">DEL</span> Delete Key</a>
    <div class="sid-group">Status</div>
    <a class="sid-link" href="#errors">Error Codes</a>
  </nav>

  <!-- MAIN -->
  <main class="main">

    <!-- HERO -->
    <div id="intro" class="section hero">
      <h1>ZURL <span>API</span> Documentation</h1>
      <p>Programmatic access to link shortening, analytics, and bio page management. All endpoints return JSON.</p>
      <div class="hero-chips">
        <span class="chip">⚡ Base URL: <code style="color:var(--accent);margin-left:6px">${baseUrl}</code></span>
        <span class="chip">🔐 JWT + API Key Auth</span>
        <span class="chip">📦 JSON Responses</span>
      </div>
    </div>

    <!-- AUTH -->
    <div id="auth" class="section">
      <div class="section-title">Authentication</div>
      <div class="intro-grid">
        <div class="info-card">
          <h4>Bearer Token (JWT)</h4>
          <code>Authorization: Bearer &lt;token&gt;</code>
          <p style="font-size:12px;color:var(--muted);margin-top:10px">Returned after login. Expires in 7 days.</p>
        </div>
        <div class="info-card">
          <h4>API Key Header</h4>
          <code>X-API-Key: sk_live_...</code>
          <p style="font-size:12px;color:var(--muted);margin-top:10px">Generate from the dashboard. Scoped permissions.</p>
        </div>
      </div>
    </div>

    <!-- CREATE URL -->
    <div id="url-create" class="section">
      <div class="section-title">Create Short URL</div>
      <div class="endpoint">
        <div class="ep-header" onclick="toggle(this)">
          <span class="ep-method badge-post" style="background:rgba(134,239,172,.12);color:#86efac">POST</span>
          <span class="ep-path">/api/urls</span>
          <span class="ep-desc">Create a new shortened URL</span>
        </div>
        <div class="ep-body open">
          <span class="auth-badge">🔐 Requires Auth</span>
          <div class="sub-title">Request Body</div>
          <table class="param-table">
            <tr><th>Field</th><th>Type</th><th>Description</th></tr>
            <tr><td>originalUrl<span class="required">*</span></td><td>string</td><td>Full URL to shorten (must start with http/https)</td></tr>
            <tr><td>customAlias</td><td>string</td><td>Optional custom short code (3–30 alphanumeric chars)</td></tr>
            <tr><td>expiresAt</td><td>ISO8601</td><td>Optional expiry datetime for the link</td></tr>
            <tr><td>password</td><td>string</td><td>Optional password to protect the redirect</td></tr>
            <tr><td>tags</td><td>string[]</td><td>Optional array of tag labels</td></tr>
          </table>
          <div class="sub-title">Example Request</div>
          <div class="tabs">
            <button class="tab active" onclick="switchTab(event,'curl-create','curl')">cURL</button>
            <button class="tab" onclick="switchTab(event,'curl-create','node')">Node.js</button>
            <button class="tab" onclick="switchTab(event,'curl-create','python')">Python</button>
          </div>
          <div id="curl-create-curl" class="snippet active"><pre>curl -X POST "${baseUrl}/api/urls" \\
  -H "X-API-Key: sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"originalUrl":"https://example.com/very/long/path","customAlias":"launch"}'</pre></div>
          <div id="curl-create-node" class="snippet"><pre>const axios = require('axios');
const res = await axios.post('${baseUrl}/api/urls', {
  originalUrl: 'https://example.com/very/long/path',
  customAlias: 'launch'
}, { headers: { 'X-API-Key': 'sk_live_...' } });
console.log(res.data.data.url.shortUrl);</pre></div>
          <div id="curl-create-python" class="snippet"><pre>import requests
r = requests.post('${baseUrl}/api/urls',
  json={"originalUrl": "https://example.com/very/long/path"},
  headers={"X-API-Key": "sk_live_..."})
print(r.json()['data']['url']['shortUrl'])</pre></div>
          <div class="sub-title">Response</div>
          <pre>{
  "success": true,
  "data": {
    "url": {
      "shortCode": "launch",
      "shortUrl": "${baseUrl}/launch",
      "originalUrl": "https://example.com/very/long/path",
      "createdAt": "2026-03-22T06:07:08.000Z"
    }
  }
}</pre>
        </div>
      </div>
    </div>

    <!-- LIST URLs -->
    <div id="url-list" class="section">
      <div class="section-title">List URLs</div>
      <div class="endpoint">
        <div class="ep-header" onclick="toggle(this)">
          <span class="ep-method badge-get" style="background:rgba(96,165,250,.12);color:#93c5fd">GET</span>
          <span class="ep-path">/api/urls</span>
          <span class="ep-desc">Paginated list of user URLs</span>
        </div>
        <div class="ep-body open">
          <span class="auth-badge">🔐 Requires Auth</span>
          <div class="sub-title">Query Parameters</div>
          <table class="param-table">
            <tr><th>Param</th><th>Type</th><th>Description</th></tr>
            <tr><td>page</td><td>number</td><td>Page number (default: 1)</td></tr>
            <tr><td>limit</td><td>number</td><td>Items per page, max 100 (default: 20)</td></tr>
            <tr><td>search</td><td>string</td><td>Filter by URL or alias</td></tr>
            <tr><td>tag</td><td>string</td><td>Filter by tag label</td></tr>
          </table>
          <div class="sub-title">Example</div>
          <pre>curl "${baseUrl}/api/urls?page=1&limit=10&search=launch" \\
  -H "X-API-Key: sk_live_..."</pre>
        </div>
      </div>
    </div>

    <!-- DELETE URL -->
    <div id="url-delete" class="section">
      <div class="section-title">Delete URL</div>
      <div class="endpoint">
        <div class="ep-header" onclick="toggle(this)">
          <span class="ep-method badge-del" style="background:rgba(248,113,113,.12);color:#f87171">DEL</span>
          <span class="ep-path">/api/urls/:shortCode</span>
          <span class="ep-desc">Permanently delete a short URL</span>
        </div>
        <div class="ep-body open">
          <span class="auth-badge">🔐 Requires Auth · delete permission</span>
          <div class="sub-title">Example</div>
          <pre>curl -X DELETE "${baseUrl}/api/urls/launch" \\
  -H "X-API-Key: sk_live_..."</pre>
          <div class="sub-title">Response</div>
          <pre>{ "success": true, "data": { "message": "URL deleted" } }</pre>
        </div>
      </div>
    </div>

    <!-- ANALYTICS -->
    <div id="analytics" class="section">
      <div class="section-title">URL Analytics</div>
      <div class="endpoint">
        <div class="ep-header" onclick="toggle(this)">
          <span class="ep-method badge-get" style="background:rgba(96,165,250,.12);color:#93c5fd">GET</span>
          <span class="ep-path">/api/analytics/:shortCode</span>
          <span class="ep-desc">Clicks, devices, geo, referrers</span>
        </div>
        <div class="ep-body open">
          <span class="auth-badge">🔐 Requires Auth</span>
          <div class="sub-title">Query Parameters</div>
          <table class="param-table">
            <tr><th>Param</th><th>Type</th><th>Description</th></tr>
            <tr><td>range</td><td>string</td><td>7d | 30d | 90d | all (default: 30d)</td></tr>
          </table>
          <div class="sub-title">Response Fields</div>
          <table class="param-table">
            <tr><th>Field</th><th>Description</th></tr>
            <tr><td>totalClicks</td><td>All-time click count</td></tr>
            <tr><td>clicksOverTime</td><td>Array of {date, clicks} objects</td></tr>
            <tr><td>devices</td><td>Breakdown by desktop/mobile/tablet</td></tr>
            <tr><td>countries</td><td>Top countries with click counts</td></tr>
            <tr><td>referrers</td><td>Top referring domains</td></tr>
          </table>
        </div>
      </div>
    </div>

    <!-- BIO -->
    <div id="bio-get" class="section">
      <div class="section-title">Bio Page</div>
      <div class="endpoint">
        <div class="ep-header" onclick="toggle(this)">
          <span class="ep-method badge-get" style="background:rgba(96,165,250,.12);color:#93c5fd">GET</span>
          <span class="ep-path">/api/bio/:username</span>
          <span class="ep-desc">Get public bio page data</span>
        </div>
        <div class="ep-body open">
          <span class="chip" style="font-size:11px;padding:4px 12px">🌐 Public — No Auth Required</span>
          <div class="sub-title">Example</div>
          <pre>curl "${baseUrl}/api/bio/john"</pre>
          <div class="sub-title">Response</div>
          <pre>{
  "success": true,
  "data": {
    "profile": { "username": "john", "bioName": "John Doe", "bioTheme": "dark" },
    "links": [{ "shortCode": "yt", "shortUrl": "...", "totalClicks": 142 }]
  }
}</pre>
        </div>
      </div>
    </div>

    <!-- API KEYS -->
    <div id="keys-list" class="section">
      <div class="section-title">API Keys</div>
      <div class="endpoint">
        <div class="ep-header" onclick="toggle(this)">
          <span class="ep-method badge-get" style="background:rgba(96,165,250,.12);color:#93c5fd">GET</span>
          <span class="ep-path">/api/apikeys</span>
          <span class="ep-desc">List all your API keys</span>
        </div>
        <div class="ep-body open">
          <span class="auth-badge">🔐 JWT Only</span>
          <pre>curl "${baseUrl}/api/apikeys" -H "Authorization: Bearer &lt;token&gt;"</pre>
        </div>
      </div>
    </div>

    <div id="keys-create" class="section" style="margin-top:-40px">
      <div class="endpoint">
        <div class="ep-header" onclick="toggle(this)">
          <span class="ep-method badge-post" style="background:rgba(134,239,172,.12);color:#86efac">POST</span>
          <span class="ep-path">/api/apikeys</span>
          <span class="ep-desc">Generate a new API key</span>
        </div>
        <div class="ep-body open">
          <span class="auth-badge">🔐 JWT Only</span>
          <div class="sub-title">Body</div>
          <table class="param-table">
            <tr><th>Field</th><th>Type</th><th>Description</th></tr>
            <tr><td>name<span class="required">*</span></td><td>string</td><td>Descriptive name for the key</td></tr>
            <tr><td>permissions</td><td>object</td><td>{read, create, update, delete} booleans</td></tr>
            <tr><td>rateLimit</td><td>number</td><td>Requests per hour (10–10000, default 100)</td></tr>
            <tr><td>expiresAt</td><td>ISO8601</td><td>Optional key expiry</td></tr>
          </table>
          <p style="font-size:12px;color:var(--red);margin-top:12px">⚠️ The raw key is only returned once. Save it immediately.</p>
        </div>
      </div>
    </div>

    <div id="keys-delete" class="section" style="margin-top:-40px">
      <div class="endpoint">
        <div class="ep-header" onclick="toggle(this)">
          <span class="ep-method badge-del" style="background:rgba(248,113,113,.12);color:#f87171">DEL</span>
          <span class="ep-path">/api/apikeys/:keyId</span>
          <span class="ep-desc">Permanently delete an API key</span>
        </div>
        <div class="ep-body open">
          <span class="auth-badge">🔐 JWT Only</span>
          <pre>curl -X DELETE "${baseUrl}/api/apikeys/&lt;keyId&gt;" \\
  -H "Authorization: Bearer &lt;token&gt;"</pre>
        </div>
      </div>
    </div>

    <!-- ERRORS -->
    <div id="errors" class="section">
      <div class="section-title">Error Codes</div>
      <table class="param-table" style="background:var(--card);border-radius:16px;border:1px solid var(--border);overflow:hidden">
        <tr><th>HTTP</th><th>Code</th><th>Meaning</th></tr>
        <tr><td style="color:var(--green)">200 / 201</td><td>—</td><td>Success</td></tr>
        <tr><td style="color:var(--red)">400</td><td>VALIDATION_ERROR</td><td>Bad request / invalid body</td></tr>
        <tr><td style="color:var(--red)">401</td><td>UNAUTHORIZED</td><td>Missing or invalid token/key</td></tr>
        <tr><td style="color:var(--red)">403</td><td>FORBIDDEN</td><td>Insufficient key permissions</td></tr>
        <tr><td style="color:var(--red)">404</td><td>NOT_FOUND</td><td>Resource not found</td></tr>
        <tr><td style="color:var(--red)">409</td><td>CONFLICT</td><td>Duplicate alias or username</td></tr>
        <tr><td style="color:var(--red)">429</td><td>RATE_LIMITED</td><td>API key rate limit exceeded</td></tr>
        <tr><td style="color:var(--red)">500</td><td>INTERNAL_ERROR</td><td>Something went wrong on our end</td></tr>
      </table>
    </div>

  </main>
</div>

<script>
  function toggle(header) {
    const body = header.nextElementSibling;
    body.classList.toggle('open');
  }
  function switchTab(e, prefix, lang) {
    const group = e.target.closest('.endpoint') || e.target.closest('.section');
    group.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
    group.querySelectorAll('.snippet').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(prefix + '-' + lang);
    if (target) target.classList.add('active');
  }
</script>
</body>
</html>`

  res.setHeader('Content-Type', 'text/html')
  res.send(html)
})

export default router
