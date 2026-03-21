export function renderPasswordPage(shortCode: string, error?: string) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Protected | ZURL</title>
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
            :root {
                --bg: #0A0A0A;
                --accent: #DFE104;
                --text: #FFFFFF;
                --border: #222222;
            }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
                background-color: var(--bg);
                color: var(--text);
                font-family: 'Space Grotesk', sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                overflow: hidden;
            }
            .container {
                max-width: 400px;
                width: 90%;
                text-align: center;
                padding: 40px;
                background: #111;
                border: 1px solid var(--border);
                border-radius: 20px;
                box-shadow: 0 40px 100px rgba(0,0,0,0.8);
            }
            .logo {
                font-size: 24px;
                font-weight: 900;
                color: var(--accent);
                letter-spacing: -0.05em;
                margin-bottom: 40px;
            }
            h1 {
                font-size: 32px;
                font-weight: 900;
                margin-bottom: 12px;
                letter-spacing: -0.04em;
            }
            p {
                color: #888;
                font-size: 14px;
                margin-bottom: 32px;
                line-height: 1.6;
            }
            form { display: flex; flexDirection: column; gap: 16px; }
            input {
                width: 100%;
                background: #000;
                border: 1px solid var(--border);
                color: #fff;
                padding: 16px;
                border-radius: 12px;
                font-size: 16px;
                outline: none;
                transition: all 0.2s;
                text-align: center;
                font-family: inherit;
            }
            input:focus { border-color: var(--accent); }
            button {
                width: 100%;
                background: var(--accent);
                color: #000;
                border: none;
                padding: 16px;
                border-radius: 12px;
                font-size: 14px;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                cursor: pointer;
                transition: transform 0.2s;
            }
            button:active { transform: scale(0.98); }
            .error {
                color: #ff4444;
                font-size: 12px;
                font-weight: 700;
                margin-top: 16px;
                text-transform: uppercase;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">ZURL ARCHITECTURE</div>
            <h1>Encrypted Link</h1>
            <p>This destination is protected by digital encryption. Please enter the access key to proceed.</p>
            
            <form method="GET" action="/${shortCode}">
                <input type="password" name="pwd" placeholder="Digital Key" autofocus required>
                ${error ? `<div class="error">${error}</div>` : ''}
                <button type="submit" style="margin-top: 24px;">Unlock Destination</button>
            </form>
        </div>
    </body>
    </html>
  `
}
