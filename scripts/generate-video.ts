import fs from 'fs';
import { loadFile } from '../src/file.js';
import { TopicEntry } from '../src/types.js';
import { execSync } from 'child_process';

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

            const videoFile = `${audioDir}/output.mp4`;
            if (fs.existsSync(videoFile)) {
                console.log(`✅ ${videoFile} already exists, skipping...`);
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
                const outputFile = `${audioDir}/${vIndex}.mp4`;

                if (fs.existsSync(outputFile)) {
                    console.log(`✅ ${outputFile} exists, skipping...`);
                    continue;
                }

                const subTextDir = `${textDir}/${vIndex}`;
                if (!fs.existsSync(subTextDir)) {
                    console.log(`✅ ${subTextDir} does not exist, skipping...`);
                    continue;
                }
                let command = `ffmpeg -y -loop 1 -i ${vocabDir}/image.jpg -i ${audioDir}/${audioFile} -vf "[in]`;
                const textFiles = fs.readdirSync(`${textDir}/${vIndex}`)
                    .sort();
                let lineHeight = 34;
                let offset = (textFiles.length - 1) * lineHeight / 2;
                let filters = [];
                for (const textFile of textFiles) {
                    console.log(offset);
                    filters.push(`drawtext=textfile=${textDir}/${vIndex}/${textFile}:fontcolor=white:fontsize=${lineHeight - 4}:x=ceil((w-text_w)/2):y=ceil((h-text_h)/2)${(offset < 0 ? '+' + (-offset) : '-' + offset)}`);
                    offset -= lineHeight;
                }
                command += filters.join(',');
                command += `[out]" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -shortest -pix_fmt yuv420p ${outputFile}`;
                console.log(command);

                execSync(command);

                break;
            }

            let textDirs = fs.readdirSync(`${textDir}`);
            let mp4Files = fs.readdirSync(audioDir).filter(file => file.endsWith('.mp4'));
            console.log(textDirs, mp4Files);
            if (textDirs.length == mp4Files.length) {
                let commands = [
                    `find . -name '*.mp4' -printf "file '%f'\n" | sort > ${audioDir}/input.txt`,
                    `ffmpeg -f concat -save 0 -i ${audioDir}/input.txt -c copy ${videoFile}`,
                    `rm ${audioDir}/input.txt`
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
