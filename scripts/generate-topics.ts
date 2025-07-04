import fs from 'fs';
import { generateTopics } from '../src/gemini.js';

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
        if (fs.existsSync(topicsPath)) {
            console.log(`✅ ${topicsPath} already exists, skipping...`);
            return;
        }

        const topics = await generateTopics(level, count, sourceLang, targetLang);

        fs.mkdirSync(dir, { recursive: true });

        fs.writeFileSync(topicsPath, JSON.stringify(topics, null, 2));
        
        console.log(`✅ Saved topics to ${topicsPath}`);
    } catch (err) {
        console.error('❌ Failed to generate topics:', err);
    }
})();
