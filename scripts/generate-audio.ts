import fs from 'fs';
import { synthesizeSpeech } from '../src/gemini.js';
import { TopicEntry, VocabEntry } from '../src/types.js';
import { loadFile } from '../src/file.js';
import { glob } from 'glob';
import wav from 'wav';

const args = process.argv.slice(2);
const sourceLang = args[0] || 'fr';
const targetLang = args[1] || 'de';
const dir = args[2];
const topicsFile = 'topics.json';
const topicsPath = `${dir}/${topicsFile}`;

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
        for (const topic of loadFile<TopicEntry>(topicsPath)) {
            let dirs = await glob(`${dir}/*/`);
            dirs.sort();
            for (const d of dirs) {
                console.log(d);
                const vocabPath = `${d}/vocab.json`;
                const audioDir = `${d}/audio`;
                fs.mkdirSync(audioDir, { recursive: true });

                let i = 0;
                for (const vocab of loadFile<VocabEntry>(vocabPath)) {
                    console.log(vocab);
                     i++;
                    const index = String(i).padStart(2, '0');
                    const audioPath = `${audioDir}/${index}.wav`;
                    if (fs.existsSync(audioPath)) {
                        console.log(`✅ ${audioPath} already exists, skipping...`);
                        continue;
                    }
                    let buffer = await synthesizeSpeech(sourceLang, targetLang, vocab);
                    if (buffer) {
                        await saveWaveFile(audioPath, buffer);
                    }
                    return;
                }
            }
        }
    } catch (err) {
        console.error('❌ Failed to generate video:', err);
    }
})();
