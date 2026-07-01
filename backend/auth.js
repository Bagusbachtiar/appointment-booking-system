require('dotenv').config();
const { getOAuth2Client, TOKEN_PATH, SCOPES } = require('./calendar');
const readline = require('readline');
const fs = require('fs');

async function authorize() {
  const auth = getOAuth2Client();
  const authUrl = auth.generateAuthUrl({ access_type: 'offline', scope: SCOPES });

  console.log('\nOpen this URL in your browser:\n');
  console.log(authUrl);
  console.log('\nAfter authorizing, paste the code here:\n');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('Code: ', async (code) => {
    rl.close();
    try {
      const { tokens } = await auth.getToken(code.trim());
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
      console.log('\ntoken.json saved. Run: npm start');
    } catch (e) {
      console.error('Auth failed:', e.message);
    }
  });
}

authorize();
