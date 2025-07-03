import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const ai = new GoogleGenAI({ vertexai: false, apiKey: process.env.GEMINI_API_KEY });

// 🧾 Eingabeparameter: Anzahl, Level, Quell- und Zielsprache
const args = process.argv.slice(2);
const count = parseInt(args[0] || '30', 10);
const level = args[1] || 'A1';
const sourceLang = args[2] || 'fr';
const targetLang = args[3] || 'de';

function loadTopics(): any {
    const topicsPath = `data/topics_${level}_${sourceLang}-${targetLang}.json`;
    if (!fs.existsSync(topicsPath)) throw new Error(`❌ File not found: ${topicsPath}`);
    const raw = fs.readFileSync(topicsPath, 'utf-8');
    return JSON.parse(raw);
}

async function generateVocab(topic: string): Promise<any> {
    const prompt = `
Generate ${count} vocabulary words for the topic "${topic}" in ${sourceLang} for language learners at ${level} level.
The topics should be relevant for learners of ${sourceLang} translating into ${targetLang}.
For each word, provide:
- The word in ${sourceLang}
- Its translation in ${targetLang}
- Example sentence in ${sourceLang}
- Its translation in ${targetLang}
Return as JSON array of objects with keys: source, target, exampleSource, exampleTarget.
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    return JSON.parse(response.text!.replace('```json', '').replace('```', ''));
}

(async () => {
    try {
        const topics = loadTopics();
        for (const [i, topic] of topics.topics.entries()) {
            const vocab = await generateVocab(topic);
            console.log(topic, vocab);
            break;
        }
    } catch (err) {
        console.error('❌ Failed to generate topics:', err);
    }
})();
