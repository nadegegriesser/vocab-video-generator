import fs from 'fs';
import { generateTextForTopic } from '../src/gemini.js';
import { TopicEntry } from '../src/types.js';
import { loadFile } from '../src/file.js';

const args = process.argv.slice(2);
const count = parseInt(args[0] || '30', 10);
const level = args[1] || 'A1';
const sourceLang = args[2] || 'fr';
const targetLang = args[3] || 'de';
const dir = args[4] || `data/${sourceLang}-${targetLang}/${level}`;
const topicsFile = 'topics.json';
const topicsPath = `${dir}/${topicsFile}`;

async function generateText(filePath: string, topic: TopicEntry) {
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${filePath} already exists, skipping...`);
        return;
    }

    const vocabs = await generateTextForTopic(level, count, sourceLang, targetLang, topic);

    fs.writeFileSync(filePath, JSON.stringify(vocabs, null, 2));
}

(async () => {
    try {
        let i = 0;
        for (const topic of loadFile<TopicEntry>(topicsPath)) {
            console.log(topic);
            i++;
            const index = String(i).padStart(2, '0');
            const vocabDir = `${dir}/${index}`;

            fs.mkdirSync(vocabDir, { recursive: true });

            await generateText(`${vocabDir}/vocab.json`, topic);
        }
    } catch (err) {
        console.error('❌ Failed to generate vocab:', err);
    }
})();
