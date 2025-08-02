import fs from 'fs';
import { loadFile } from '../src/file.js';
import { TopicEntry } from '../src/types.js';
import { execSync } from 'child_process';
import { Z_FIXED } from 'zlib';

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

            const videoDir = `${vocabDir}/video`;
            const videoFile = `${vocabDir}/output.mp4`;
            if (fs.existsSync(videoFile)) {
                console.log(`✅ ${videoFile} already exists, skipping...`);
                continue;
            }

            const imageDir = `${vocabDir}/images`;
            if (!fs.existsSync(imageDir)) {
                console.log(`✅ ${imageDir} does not exist, skipping...`);
                continue;
            }

            const audioDir = `${vocabDir}/audio`;
            if (!fs.existsSync(audioDir)) {
                console.log(`✅ ${audioDir} does not exist, skipping...`);
                continue;
            }

            const imageFiles = fs.readdirSync(imageDir)
                .filter(file => file.endsWith('.jpg'))
                .sort();

            const audioFiles = fs.readdirSync(audioDir)
                .filter(file => file.endsWith('.wav'))
                .sort();

            const textDir = `${vocabDir}/text`;
            if (!fs.existsSync(textDir)) {
                console.log(`✅ ${textDir} does not exist, skipping...`);
                continue;
            }

            const textDirs = fs.readdirSync(`${textDir}`);

            console.log(imageFiles, textDirs, audioFiles);
            if (imageFiles.length != audioFiles.length || textDirs.length != audioFiles.length) {
                continue;
            }

            fs.mkdirSync(videoDir, { recursive: true });

            let desc = '';
            let totalDuration = 0;
            for (const audioFile of audioFiles) {
                console.log(audioFile);
                const vIndex = audioFile.slice(0, audioFile.lastIndexOf('.'));
                const outputFile = `${videoDir}/${vIndex}.mp4`;

                const imageFile = `${imageDir}/${vIndex}.jpg`;
                if (!fs.existsSync(imageFile)) {
                    console.log(`✅ ${imageFile} does not exist, skipping...`);
                    continue;
                }

                const subTextDir = `${textDir}/${vIndex}`;
                if (!fs.existsSync(subTextDir)) {
                    console.log(`✅ ${subTextDir} does not exist, skipping...`);
                    continue;
                }

                let command = `ffmpeg -y -loop 1 -i ${imageFile} -i ${audioDir}/${audioFile} -vf "[in]`;
                const textFiles = fs.readdirSync(`${subTextDir}`).sort();
                let lineHeight = 64;
                let offset = (textFiles.length - 1) * lineHeight / 2;
                let filters = [];
                for (const textFile of textFiles) {
                    console.log(offset);
                    filters.push(`drawtext=textfile=${subTextDir}/${textFile}:font=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:fontcolor=white:fontsize=${lineHeight - 32}:x=ceil((w-text_w)/2):y=ceil((h-text_h)/2)${(offset < 0 ? '+' + (-offset) : '-' + offset)}`);
                    offset -= lineHeight;
                }
                command += filters.join(',');
                command += `[out]" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -shortest -pix_fmt yuv420p ${outputFile}`;
                console.log(command);

                execSync(command);

                command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${audioDir}/${audioFile}`;
                console.log(command);

                const res = execSync(command);
                const duration = parseFloat(res.toString().trim());
                console.log(duration);

                let text = '';
                if (vIndex == '00') {
                    text = 'Introduction - Einführung';
                    command = `ffmpeg -i ${outputFile} -ss 00:00:01 -frames:v 1 ${vocabDir}/thumbnail.png`;
                    console.log(command);
                    execSync(command);
                }
                else if (vIndex == String(textDirs.length - 1).padStart(2, '0')) {
                    text = 'Conclusion - Zusammenfassung';
                }
                else if (textFiles.length > 1) {
                    let textFile = textFiles[0];
                    let textPath = `${textDir}/${vIndex}/${textFile}`;
                    text = fs.readFileSync(textPath, 'utf-8');
                    text += ' - ';
                    textFile = textFiles[1];
                    textPath = `${textDir}/${vIndex}/${textFile}`;
                    text += fs.readFileSync(textPath, 'utf-8');
                }
                const m = String(Math.floor(totalDuration / 60)).padStart(2, '0');
                const s = String(Math.round(totalDuration % 60)).padStart(2, '0');
                desc += `${m}:${s} ${text}\n`;
                totalDuration += duration;
            }

            fs.writeFileSync(`${vocabDir}/desc.txt`, desc);

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
