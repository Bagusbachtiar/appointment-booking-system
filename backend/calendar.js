const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials.json');
const TOKEN_PATH = path.join(__dirname, 'token.json');
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

function getOAuth2Client() {
  const creds = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  const { client_id, client_secret, redirect_uris } = creds.installed;
  return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
}

function getAuthClient() {
  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error('Not authenticated. Run: npm run auth');
  }
  const auth = getOAuth2Client();
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  auth.setCredentials(token);
  auth.on('tokens', (newTokens) => {
    if (newTokens.refresh_token) token.refresh_token = newTokens.refresh_token;
    token.access_token = newTokens.access_token;
    token.expiry_date = newTokens.expiry_date;
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
  });
  return auth;
}

function getCalendar() {
  return google.calendar({ version: 'v3', auth: getAuthClient() });
}

module.exports = { getOAuth2Client, getAuthClient, getCalendar, TOKEN_PATH, SCOPES };
