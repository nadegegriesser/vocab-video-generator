import fs from 'fs';
import { loadFile } from '../src/file.js';
import { TopicEntry } from '../src/types.js';
import { google } from 'googleapis';
import { Credentials, OAuth2Client } from 'google-auth-library';
import { GaxiosError, GaxiosResponse } from 'gaxios';
import dotenv from 'dotenv';

const args = process.argv.slice(2);
const level = args[0] || 'A1';
const dir = args[1];
const topicsFile = 'topics.json';
const topicsPath = `${dir}/${topicsFile}`;
const videoFile = 'output.mp4';

dotenv.config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  'http://localhost' // Redirect URI muss nicht verwendet werden beim Refresh Token
);

const SCOPES = [
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtubepartner',
  'https://www.googleapis.com/auth/youtube.force-ssl',
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/youtube.upload'];


async function authorize(callback: (oauth2Client: OAuth2Client) => void) {
  // Check if we have previously stored a token.
  if (REFRESH_TOKEN != undefined && REFRESH_TOKEN != '') {
    oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
    callback(oauth2Client);
  } else {
    await getNewToken(callback);
  }
}

async function getNewToken(callback: (oauth2Client: OAuth2Client) => void) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  const code: string = '4/0AVMBsJiGpsS26PoR-I09GR8CiSa23T8eq-wlJx4va8NhkzqjncQlat9v3z3GiaLg-_MXIw';
  oauth2Client.getToken(code, function (err: GaxiosError<any> | null, token: Credentials | null | undefined) {
    if (err) {
      console.log('Error while trying to retrieve access token', err);
      return;
    }
    if (token) {
      console.log(token);
      oauth2Client.credentials = token;
      callback(oauth2Client);
    }
  });
}

async function uploadVideo(oauth2Client: OAuth2Client): Promise<void> {
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
        const thumbnailPath = `${vocabDir}/thumbnail.png`;

        if (fs.existsSync(videoPath) && fs.existsSync(thumbnailPath)) {
          const title = `Französisch lernen ${level}: ${topic.target} - Vokabeln, Beispiele und Übersetzungen`;
          console.log(title);

          const videos = res.data.items?.filter(item => item.snippet?.title == title);
          console.log(videos);

          if (videos && videos.length == 0) {
            const descPath = `${vocabDir}/desc.txt`;
            const description = fs.readFileSync(descPath, 'utf-8');
            const levelTag = level.toLowerCase();
            const response1 = await youtube.videos.insert({
              part: ['snippet', 'status'],
              requestBody: {
                snippet: {
                  title: title,
                  description: description,
                  tags: ['vokabeln', 'französisch', levelTag, topic.target, topic.source,
                    'französisch vokabeln', `französisch ${levelTag}`, 'französisch lernen anfänger',
                    'französisch deutsch', `französisch vokabeln ${levelTag}`, 'französisch mit übersetzung', 'französisch für anfänger',
                    'französisch einfach lernen', 'französisch lernen deutsch', 'französisch grundwortschatz',
                    'französisch online lernen', `französisch ${levelTag} vokabeln`]
                },
                status: {
                  privacyStatus: 'public',
                  madeForKids: false,
                  selfDeclaredMadeForKids: false
                }
              },
              media: {
                body: fs.createReadStream(videoPath)
              },
              notifySubscribers: true
            });
            console.log('✅ Video uploaded successfully!');
            console.log('🔗 Video ID:', response1.data!.id);
            console.log(`📺 Watch at: https://www.youtube.com/watch?v=${response1.data.id}`);
            if (response1.data) {
              const response2 = await youtube.thumbnails.set({
                videoId: response1.data.id!,
                media: {
                  mimeType: 'image/png',
                  body: fs.createReadStream(thumbnailPath)
                }
              });
            }
            return;
          } else {
            console.log(`Video with title ${title} exists.`);
          }
        }
      }
    }
  }

}

(async () => {
  try {
    await authorize(uploadVideo);
  } catch (err) {
    console.error('❌ Failed to upload video:', err);
  }
})();
