import fs from 'fs';
import { generateVocabForTopic, synthesizeSpeech } from '../src/gemini.js';
import { TopicEntry, VocabEntry } from '../src/types.js';
import { loadFile } from '../src/file.js';
import { glob } from 'glob';

// 🧾 Eingabeparameter: Anzahl, Level, Quell- und Zielsprache
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
            for (const v of await glob("dir/*/")) {
                console.log(v);
                const vocabPath = ``;
                for (const vocab of loadFile<VocabEntry>(vocabPath)) {

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
