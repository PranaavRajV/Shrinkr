export function renderPasswordPage(shortCode: string, error?: string) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Protected | ZURL</title>
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@400;700&display=swap" rel="stylesheet">
        <style>
            :root {
                --bg: #0A0A0A;
                --bg-secondary: #111111;
                --accent: #CBFF00;
                --text: #FFFFFF;
                --text-muted: #A0A0A0;
                --border: #222222;
            }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
                background-color: var(--bg);
                color: var(--text);
                font-family: 'Inter', sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                overflow: hidden;
            }
            .container {
                max-width: 440px;
                width: 90%;
                text-align: center;
                padding: 48px;
                background: var(--bg-secondary);
                border: 1px solid var(--border);
                border-radius: 20px;
                box-shadow: 0 40px 100px rgba(0,0,0,0.8);
            }
            .logo {
                font-family: 'Space Grotesk', sans-serif;
                font-size: 11px;
                font-weight: 900;
                color: var(--accent);
                letter-spacing: 0.3em;
                margin-bottom: 40px;
                text-transform: uppercase;
            }
            h1 {
                font-family: 'Space Grotesk', sans-serif;
                font-size: 32px;
                font-weight: 700;
                margin-bottom: 12px;
                letter-spacing: -0.04em;
                text-transform: uppercase;
            }
            p {
                color: var(--text-muted);
                font-size: 14px;
                margin-bottom: 32px;
                line-height: 1.6;
            }
            form { display: flex; flex-direction: column; gap: 16px; }
            input {
                width: 100%;
                background: var(--bg);
                border: 1px solid var(--border);
                color: #fff;
                padding: 16px;
                border-radius: 10px;
                font-size: 15px;
                outline: none;
                transition: all 0.2s;
                text-align: center;
                font-family: inherit;
            }
            input:focus { border-color: var(--accent); box-shadow: 0 0 15px rgba(203, 255, 0, 0.1); }
            button {
                width: 100%;
                background: var(--accent);
                color: #000;
                border: none;
                padding: 16px;
                border-radius: 10px;
                font-size: 13px;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                cursor: pointer;
                transition: transform 0.2s, background 0.2s;
            }
            button:hover { background: #bada00; }
            button:active { transform: scale(0.98); }
            .error {
                color: #ff4444;
                font-size: 11px;
                font-weight: 800;
                margin-top: 16px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">ZURL ARCHITECTURE</div>
            <h1>PROTECTED LINK</h1>
            <p>Access to this destination requires digital authorization. Please enter the assigned key.</p>
            
            <form method="GET" action="/${shortCode}">
                <input type="password" name="pwd" placeholder="Enter key" autofocus required>
                ${error ? `<div class="error">${error}</div>` : ''}
                <button type="submit" style="margin-top: 24px;">Unlock Destination</button>
            </form>
        </div>
    </body>
    </html>
  `
}

