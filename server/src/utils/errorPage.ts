export const renderErrorPage = (status: number, message: string, code: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${code} - Zurl</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;700;900&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            background: #09090B; 
            color: #FAFAFA; 
            font-family: 'Space Grotesk', sans-serif; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            min-height: 100vh;
            overflow: hidden;
        }
        .container {
            text-align: center;
            padding: 40px;
            border: 4px solid #3F3F46;
            background: #111;
            position: relative;
            max-width: 500px;
            width: 90%;
        }
        .status {
            font-size: 120px;
            font-weight: 900;
            line-height: 1;
            color: #ef4444;
            margin-bottom: 20px;
            letter-spacing: -0.05em;
        }
        .code {
            position: absolute;
            top: -15px;
            left: 20px;
            background: #DFE104;
            color: #000;
            padding: 4px 12px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }
        h1 {
            font-size: 24px;
            text-transform: uppercase;
            margin-bottom: 12px;
            letter-spacing: -0.02em;
        }
        p {
            color: #A1A1AA;
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 32px;
        }
        .btn {
            display: inline-block;
            background: #DFE104;
            color: #000;
            padding: 14px 28px;
            text-decoration: none;
            font-weight: 700;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            transition: transform 0.1s;
        }
        .btn:active { transform: scale(0.95); }
    </style>
</head>
<body>
    <div class="container">
        <div class="code">${code}</div>
        <div class="status">${status}</div>
        <h1>Something went wrong</h1>
        <p>${message}</p>
        <a href="/" class="btn">Return to Zurl →</a>
    </div>
</body>
</html>
`
