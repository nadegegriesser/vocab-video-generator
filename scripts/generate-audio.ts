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
                for (const vocab of loadFile<VocabEntry>(vocabPath)) {
                    console.log(vocab);
                    /*fs.mkdirSync(wavsPath, { recursive: true });

                    let i = 0;
                    for (const vocab of vocabs) {
                        i++;
                        const filePath = `${wavsPath}/${String(i).padStart(2, '0')}.wav`;
                        if (fs.existsSync(filePath)) {
                            console.log(`✅ ${filePath} already exists, skipping...`);
                            continue;
                        }

                        let buffer = await synthesizeSpeech(sourceLang, targetLang, vocab);
                        if (buffer) {
                            fs.writeFileSync(filePath, buffer);
                        }
                    }
                    if (i == count) {
                        saveTopics(topics);
                    }*/
                }
            }
        }
    } catch (err) {
        console.error('❌ Failed to generate video:', err);
    }
})();
