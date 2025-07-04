import fs from 'fs';
import { generateVocabForTopic } from '../src/gemini.js';
import { TopicEntry } from '../src/types.js';

// 🧾 Eingabeparameter: Anzahl, Level, Quell- und Zielsprache
const args = process.argv.slice(2);
const count = parseInt(args[0] || '30', 10);
const level = args[1] || 'A1';
const sourceLang = args[2] || 'fr';
const targetLang = args[3] || 'de';
const dir = args[4] || `data/${sourceLang}-${targetLang}/${level}`;
const topicsFile = 'topics.json';
const topicsPath = `${dir}/${topicsFile}`;
const vocabFile = 'vocab.json';
const vocabPath = `${dir}/${vocabFile}`;

function loadTopics(): TopicEntry[] {
    if (!fs.existsSync(topicsPath)) {
        return [];
    }
    const raw = fs.readFileSync(topicsPath, 'utf-8');
    return <TopicEntry[]>JSON.parse(raw);
}

(async () => {
    try {
       for (const topic of loadTopics()) {

            const vocabs = await generateVocabForTopic(level, count, sourceLang, targetLang, topic.source);

            fs.mkdirSync(dir, { recursive: true });
            
            fs.writeFileSync(vocabPath, JSON.stringify(vocabs, null, 2));
        }
    } catch (err) {
        console.error('❌ Failed to generate video:', err);
    }
})();
