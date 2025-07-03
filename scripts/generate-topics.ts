import fs from 'fs';
import { generateTopics } from '../src/gemini.js';

// 🧾 Eingabeparameter: Anzahl, Level, Quell- und Zielsprache
const args = process.argv.slice(2);
const count = parseInt(args[0] || '30', 10);
const level = args[1] || 'A1';
const sourceLang = args[2] || 'fr';
const targetLang = args[3] || 'de';

(async () => {
    try {
        const topics = await generateTopics(level, count, sourceLang, targetLang);

        fs.mkdirSync('data', { recursive: true });

        const fileName = `data/topics_${level}_${sourceLang}-${targetLang}.json`;

        fs.writeFileSync(fileName, JSON.stringify(topics, null, 2));
        console.log(`✅ Saved topics to ${fileName}`);
    } catch (err) {
        console.error('❌ Failed to generate topics:', err);
    }
})();
