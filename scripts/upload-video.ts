import fs from 'fs';
import { loadFile } from '../src/file.js';
import { TopicEntry } from '../src/types.js';
import { execSync } from 'child_process';

const args = process.argv.slice(2);
const dir = args[0];
const topicsFile = 'topics.json';
const topicsPath = `${dir}/${topicsFile}`;

/*
const CLIENT_ID = 'DEIN_CLIENT_ID';
const CLIENT_SECRET = 'DEIN_CLIENT_SECRET';
const REFRESH_TOKEN = 'DEIN_REFRESH_TOKEN';

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
*/

(async () => {
    try {
        let t = 0;
        console.log(topicsPath);
        for (const topic of loadFile<TopicEntry>(topicsPath)) {
            console.log(topic);
            t++;
            const tIndex = String(t).padStart(2, '0');
            const vocabDir = `${dir}/${tIndex}`;

            const videoDir = `${vocabDir}/video`;
            const videoFile = `${vocabDir}/output.mp4`;
            if (fs.existsSync(videoFile)) {
                console.log(`✅ ${videoFile} already exists, skipping...`);
                continue;
            }

            const audioDir = `${vocabDir}/audio`;
            if (!fs.existsSync(audioDir)) {
                console.log(`✅ ${audioDir} does not exist, skipping...`);
                continue;
            }

            const audioFiles = fs.readdirSync(audioDir)
                .filter(file => file.endsWith('.wav'))
                .sort();
            
            const textDir = `${vocabDir}/text`;
            if (!fs.existsSync(textDir)) {
                console.log(`✅ ${textDir} does not exist, skipping...`);
                continue;
            }

            const textDirs = fs.readdirSync(`${textDir}`);
            
            console.log(textDirs, audioFiles);
            if (textDirs.length != audioFiles.length) {
                continue;
            }

            fs.mkdirSync(videoDir, {recursive: true});
            
            for (const audioFile of audioFiles) {
                console.log(audioFile);
                const vIndex = audioFile.slice(0, audioFile.lastIndexOf('.'));
                const outputFile = `${videoDir}/${vIndex}.mp4`;

                const subTextDir = `${textDir}/${vIndex}`;
                if (!fs.existsSync(subTextDir)) {
                    console.log(`✅ ${subTextDir} does not exist, skipping...`);
                    continue;
                }

                let command = `ffmpeg -y -loop 1 -i ${vocabDir}/image.jpg -i ${audioDir}/${audioFile} -vf "[in]`;
                const textFiles = fs.readdirSync(`${textDir}/${vIndex}`)
                    .sort();
                let lineHeight = 64;
                let offset = (textFiles.length - 1) * lineHeight / 2;
                let filters = [];
                for (const textFile of textFiles) {
                    console.log(offset);
                    filters.push(`drawtext=textfile=${textDir}/${vIndex}/${textFile}:font=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:fontcolor=white:fontsize=${lineHeight - 32}:x=ceil((w-text_w)/2):y=ceil((h-text_h)/2)${(offset < 0 ? '+' + (-offset) : '-' + offset)}`);
                    offset -= lineHeight;
                }
                command += filters.join(',');
                command += `[out]" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -shortest -pix_fmt yuv420p ${outputFile}`;
                console.log(command);

                execSync(command);
            }

            const mp4Files = fs.readdirSync(videoDir).filter(file => file.endsWith('.mp4'));
            console.log(textDirs, mp4Files);
            if (textDirs.length == mp4Files.length) {
                let commands = [
                    `find ${videoDir} -name '*.mp4' -printf "file '%p'\n" | sort > input.txt`,
                    `ffmpeg -f concat -i input.txt -c copy ${videoFile}`,
                    `rm -Rf ${videoDir} input.txt`
                ];
                for (let command of commands) {
                    execSync(command);
                }
            }
            return;
        }
    } catch (err) {
        console.error('❌ Failed to generate video:', err);
    }
})();
