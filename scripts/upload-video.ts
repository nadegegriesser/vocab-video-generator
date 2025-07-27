import fs from 'fs';
import { loadFile } from '../src/file.js';
import { TopicEntry } from '../src/types.js';
import { execSync } from 'child_process';
import { google } from 'googleapis';
import dotenv from 'dotenv';

const args = process.argv.slice(2);
const dir = args[0];

dotenv.config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  'http://localhost' // Redirect URI muss nicht verwendet werden beim Refresh Token
);

oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const youtube = google.youtube({
  version: 'v3',
  auth: oauth2Client,
});


(async () => {
    try {
        const response = await youtube.channels.list({
            part: ['snippet', 'statistics'],
            mine: true
        });
        if (response.data.items && response.data.items.length > 0) {
            const channel = response.data.items[0];
            if (channel) {
                console.log('🔹 Kanalname:', channel.snippet?.title);
                console.log('🆔 ID:', channel.id);
                console.log('👀 Aufrufe:', channel.statistics?.viewCount);
                console.log('👥 Abonnenten:', channel.statistics?.subscriberCount);
                console.log('🎥 Videos:', channel.statistics?.videoCount);
                console.log('All:', channel);
            }
        }
    } catch (err) {
        console.error('❌ Failed to upload video:', err);
    }
})();
