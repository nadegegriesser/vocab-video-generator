import fs from 'fs';
import { generateVocabForTopic, synthesizeSpeech } from '../src/gemini.js';
import { TopicEntry, VocabEntry } from '../src/types.js';
import { loadFile } from '../src/file.js';
import { glob } from 'glob';

const args = process.argv.slice(2);
const sourceLang = args[0] || 'fr';
const targetLang = args[1] || 'de';
const dir = args[2];
const topicsFile = 'topics.json';
const topicsPath = `${dir}/${topicsFile}`;
const vocabFile = 'vocab.json';

function saveTopics(topics: TopicEntry[]) {
    fs.writeFileSync(topicsPath, JSON.stringify(topics, null, 2));
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
                        fs.writeFileSync(audioPath, buffer);
                    }
                    return;
                }
            }
        }
    } catch (err) {
        console.error('❌ Failed to generate video:', err);
    }
})();
