import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const ai = new GoogleGenAI({vertexai: false, apiKey: process.env.GEMINI_API_KEY});

// 🧾 Eingabeparameter: Anzahl, Level, Quell- und Zielsprache
const args = process.argv.slice(2);
const count = parseInt(args[0] || '30', 10);
const level = args[1] || 'A1';
const sourceLang = args[2] || 'fr';
const targetLang = args[3] || 'de';

async function generateTopics(): Promise<any> {
    const prompt = `
Generate ${count} vocabulary topics for ${sourceLang} language learners at ${level} level.
The topics should be relevant for learners of ${sourceLang} translating into ${targetLang}.
For each topic, provide:
- Topic name in ${sourceLang}
- Translation in ${targetLang}
Return as JSON object with keys: sourceLang, targetLang, level and topics. topics is a JSON array with keys: source, target.
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    return JSON.parse(response.text!.replace('```json', '').replace('```', ''));
}

(async () => {
    try {
        const topics = await generateTopics();

        console.log(topics);

        fs.mkdirSync('data', { recursive: true });

        const fileName = `data/topics_${level}_${sourceLang}-${targetLang}.json`;

        fs.writeFileSync(fileName, JSON.stringify(topics, null, 2));
        console.log(`✅ Saved topics to ${fileName}`);
    } catch (err) {
        console.error('❌ Failed to generate topics:', err);
    }
})();
