import fs from 'fs';
import { generateVocabForTopic } from '../src/gemini.js';
import { TopicEntry } from '../src/types.js';

// 🧾 Eingabeparameter: Anzahl, Level, Quell- und Zielsprache
const args = process.argv.slice(2);
const count = parseInt(args[0] || '30', 10);
const level = args[1] || 'A1';
const sourceLang = args[2] || 'fr';
const targetLang = args[3] || 'de';
const topicsPath = `data/topics_${level}_${sourceLang}-${targetLang}.json`;

function loadTopics(): TopicEntry[] {
    if (!fs.existsSync(topicsPath)) {
        throw new Error(`❌ File not found: ${topicsPath}`);
    }
    const raw = fs.readFileSync(topicsPath, 'utf-8');
    return <TopicEntry[]>JSON.parse(raw);
}

function saveTopics(topics: TopicEntry[]) {
    fs.writeFileSync(topicsPath, JSON.stringify(topics, null, 2));
}

(async () => {
    try {
        let topics = loadTopics();

        const topic = topics.shift();
        if (!topic) {
            console.log('✅ No topic left.');
            return 1;
        }

        const vocab = await generateVocabForTopic(topic.source, level, count, sourceLang, targetLang);

        console.log(topic, vocab);

        saveTopics(topics);
        
        return 0;
    } catch (err) {
        console.error('❌ Failed to generate topics:', err);
        return 1;
    }
})();
