import fs from 'fs';
import { synthesizeSpeech } from '../src/gemini.js';
import { TopicEntry, VocabEntry } from '../src/types.js';
import { loadFile } from '../src/file.js';
import wav from 'wav';

const args = process.argv.slice(2);
const name1 = args[0];
const voice1 = args[1];
const style1 = args[2];
const name2 = args[3];
const voice2 = args[4];
const style2 = args[5];
const sourceLang = args[6] || 'fr';
const targetLang = args[7] || 'de';
const dir = args[8];
const topicsFile = 'topics.json';
const topicsPath = `${dir}/${topicsFile}`;

async function saveAudio(filePath: string, vocab: VocabEntry) {
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${filePath} already exists, skipping...`);
    } else {
        let buffer = await synthesizeSpeech(name1, voice1, style1, name2, voice2, style2, sourceLang, targetLang, vocab);
        if (buffer) {
            await saveWaveFile(filePath, buffer);
        }
        return true;
    }
    return false;
}

async function saveWaveFile(
    filePath: string,
    pcmData: any,
    channels = 1,
    rate = 24000,
    sampleWidth = 2,
) {
    return new Promise((resolve, reject) => {
        const writer = new wav.FileWriter(filePath, {
            channels,
            sampleRate: rate,
            bitDepth: sampleWidth * 8,
        });

        writer.on('finish', resolve);
        writer.on('error', reject);

        writer.write(pcmData);
        writer.end();
    });
}

(async () => {
    try {
        let t = -1;
        for (const topic of loadFile<TopicEntry>(topicsPath)) {
            t++;
            const index = String(t).padStart(2, '0');
            const topicDir = `${dir}/${index}`;
            const audioDir = `${topicDir}/audio`;
            fs.mkdirSync(audioDir, { recursive: true });

            const vocabPath = `${topicDir}/vocab.json`;
            let v = -1;
            for (const vocab of loadFile<VocabEntry>(vocabPath)) {
                console.log(vocab);
                v++;
                const index = String(v).padStart(2, '0');
                if (await saveAudio(`${audioDir}/${index}.wav`, vocab)) {
                    return;
                }
            }
        }
    } catch (err) {
        console.error('❌ Failed to generate video:', err);
    }
})();
