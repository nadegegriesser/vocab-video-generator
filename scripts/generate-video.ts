import fs from 'fs';
import { loadFile } from '../src/file.js';
import { TopicEntry } from '../src/types.js';
import { exec } from 'child_process';

const args = process.argv.slice(2);
const dir = args[0];
const topicsFile = 'topics.json';
const topicsPath = `${dir}/${topicsFile}`;


(async () => {
    try {
        let t = 0;
        console.log(topicsPath);
        for (const topic of loadFile<TopicEntry>(topicsPath)) {
            console.log(topic);
            t++;
            const tIndex = String(t).padStart(2, '0');
            const vocabDir = `${dir}/${tIndex}`;
            const filePath = `${vocabDir}/output.mp4`

            if (fs.existsSync(filePath)) {
                console.log(`✅ ${filePath} already exists, skipping...`);
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
            for (const audioFile of audioFiles) {
                console.log(audioFile);
                const vIndex = audioFile.slice(0, audioFile.lastIndexOf('.'));
                const subTextDir = `${textDir}/${vIndex}`;
                if (!fs.existsSync(subTextDir)) {
                    console.log(`✅ ${subTextDir} does not exist, skipping...`);
                    continue;
                }
                let command = `ffmpeg -y -loop 1 -i data/image.jpg -i ${audioDir}/${audioFile} `;
                const textFiles = fs.readdirSync(`${textDir}/${vIndex}`)
                    .sort();
                let lineHeight = 32;
                let offset = (textFiles.length - 1) * lineHeight / 2;
                for (const textFile of textFiles) {
                    command += `-vf "drawtext=textfile=${textDir}/${vIndex}/${textFile}:fontcolor=white:fontsize=${lineHeight - 2}:x=(w-text_w)/2:y=(h-text_h)/2-${offset}" `;
                    offset += lineHeight;
                }
                command += `-c:v libx264 -tune stillimage -c:a aac -b:a 192k -shortest -pix_fmt yuv420p ${audioDir}/${vIndex}.mp4`;
                console.log(command);

                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`exec error: ${error}`);
                        return;
                    }
                    console.log(`stdout: ${stdout}`);
                    console.error(`stderr: ${stderr}`);
                });
                return;
            }
        }
    } catch (err) {
        console.error('❌ Failed to generate video:', err);
    }
})();
