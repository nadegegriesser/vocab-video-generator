import fs from 'fs';
import { generateVocabForTopic } from '../src/gemini.js';
import { TopicEntry } from '../src/types.js';
import { loadFile } from '../src/file.js';

// 🧾 Eingabeparameter: Anzahl, Level, Quell- und Zielsprache
const args = process.argv.slice(2);
const count = parseInt(args[0] || '30', 10);
const level = args[1] || 'A1';
const sourceLang = args[2] || 'fr';
const targetLang = args[3] || 'de';
const dir = args[4] || `data/${sourceLang}-${targetLang}/${level}`;
const topicsFile = 'topics.json';
const topicsPath = `${dir}/${topicsFile}`;

(async () => {
    try {
        let i = 0;
        for (const topic of loadFile<TopicEntry>(topicsPath)) {
            console.log(topic);
            i++;
            const index = String(i).padStart(2, '0');
            const vocabDir = `${dir}/${index}`;
            const vocabPath = `${vocabDir}/vocab.json`;

            if (fs.existsSync(vocabPath)) {
                console.log(`✅ ${vocabPath} already exists, skipping...`);
                continue;
            }

            const vocabs = await generateVocabForTopic(level, count, sourceLang, targetLang, topic.source);
            console.log(vocabs);

            fs.mkdirSync(vocabDir, { recursive: true });

            fs.writeFileSync(vocabPath, JSON.stringify(vocabs, null, 2));
        }
    } catch (err) {
        console.error('❌ Failed to generate vocab:', err);
    }
})();
