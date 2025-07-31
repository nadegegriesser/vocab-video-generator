import fs from 'fs';
import { loadFile } from '../src/file.js';
import { TopicEntry } from '../src/types.js';
import { execSync } from 'child_process';
import { google } from 'googleapis';
import { Credentials, OAuth2Client } from 'google-auth-library';
import { GaxiosError, GaxiosResponse } from 'gaxios';
import dotenv from 'dotenv';

const args = process.argv.slice(2);
const dir = args[0];
const topicsFile = 'topics.json';
const topicsPath = `${dir}/${topicsFile}`;
const videoFile = 'output.mp4';

dotenv.config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  'http://localhost' // Redirect URI muss nicht verwendet werden beim Refresh Token
);

const SCOPES = ['https://www.googleapis.com/auth/youtube.readonly', 'https://www.googleapis.com/auth/youtube.upload'];
const TOKEN_DIR = '.credentials/';
const TOKEN_PATH = TOKEN_DIR + 'token.json';


function authorize(callback: (oauth2Client: OAuth2Client) => void) {
  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, 'utf-8', async function (err: NodeJS.ErrnoException | null, token: string) {
    if (err) {
      console.log(err);
      await getNewToken(callback);
    } else {
      oauth2Client.setCredentials({ refresh_token: JSON.parse(token).refresh_token });
      callback(oauth2Client);
    }
  });
}

async function getNewToken(callback: (oauth2Client: OAuth2Client) => void) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  //console.log('AAAA', await axios.get(authUrl));
  const code: string = '4/0AVMBsJhOw9SG8xT-915I915mQtH7UktgCHYo7zTxckA_KdMlKQtnfKiOwleNkefLRSWa7w';
  oauth2Client.getToken(code, function (err: GaxiosError<any> | null, token: Credentials | null | undefined) {
    if (err) {
      console.log('Error while trying to retrieve access token', err);
      return;
    }
    if (token) {
      console.log(token);
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    }
  });
}

function storeToken(token: Credentials) {
  fs.mkdirSync(TOKEN_DIR);
  fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
    if (err) throw err;
    console.log('Token stored to ' + TOKEN_PATH);
  });
}

async function getChannel(oauth2Client: OAuth2Client): Promise<void> {
  const youtube = google.youtube({
    version: 'v3',
    auth: oauth2Client,
  });
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

      const res = await youtube.search.list({
        part: ["snippet"],
        channelId: channel.id!,
        maxResults: 10,
        order: "date"
      });


      res.data.items?.forEach((item) => {
        console.log(item);
        console.log(`📹 ${item.snippet?.title} — https://youtube.com/watch?v=${item.id?.videoId}`);
      });

      
        let t = 0;
        for (const topic of loadFile<TopicEntry>(topicsPath)) {
            console.log(topic);
            t++;
            const tIndex = String(t).padStart(2, '0');
            const vocabDir = `${dir}/${tIndex}`;
            const videoPath = `${vocabDir}/${videoFile}`;

            if (fs.existsSync(videoPath)) {
            const title = `Französisch lernen A1: ${topic.target} - Vokabeln, Beispiele und Übersetzungen`;
            console.log(title);

            const videos = res.data.items?.filter(item => item.snippet?.title == title);
            console.log(videos);

            if (videos && videos.length == 0) {
           const response1 = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: title,
          description: 'Uploaded via Node.js and YouTube API',
          tags: ['Vokabeln', 'Französisch', 'A1', topic.target, topic.source]
        },
        status: {
          privacyStatus: 'public'
        },
      },
      media: {
body: fs.createReadStream(videoPath)
      }
    });
  console.log('✅ Video uploaded successfully!');
    console.log('🔗 Video ID:', response1.data!.id);
    console.log(`📺 Watch at: https://www.youtube.com/watch?v=${response1.data.id}`);
              return;
      }
        }
    }
  }
  }

}

(async () => {
  try {
    authorize(getChannel);
  } catch (err) {
    console.error('❌ Failed to upload video:', err);
  }
})();
