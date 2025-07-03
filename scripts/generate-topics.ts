import fs from 'fs';
import dotenv from 'dotenv';
import axios from 'axios';
import https from 'https';

dotenv.config();

// 🧾 Eingabeparameter: Anzahl, Level, Quell- und Zielsprache
const args = process.argv.slice(2);
const count = parseInt(args[0] || '30', 10);
const level = args[1] || 'A1';
const sourceLang = args[2] || 'fr';
const targetLang = args[3] || 'de';

async function generateTopics(): Promise<string[]> {
    const prompt = `
Generate ${count} vocabulary topics for language learners at ${level} level.
The topics should be relevant for learners of ${sourceLang} translating into ${targetLang}.
For each topic, provide:
- Topic name in ${sourceLang}
- Translation in ${targetLang}
Return as JSON object with level and topics as JSON array.
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const body = {
        contents: [
            {
                "parts": [
                    {
                        "text": prompt
                    }
                ]
            }
        ]
    };

    const response = await axios.create({
        httpsAgent: new https.Agent({
            rejectUnauthorized: false
        })
    }).post(url, body);
    console.log(response.data.candidates[0].content.parts[0].text);
    return JSON.parse(response.data.candidates[0].content.parts[0].text.replace('```json', '').replace('```', ''));
}

(async () => {
    try {
        const topics = await generateTopics();

        fs.mkdirSync('data', { recursive: true });

        const fileName = `data/topics_${count}_${level}_${sourceLang}-${targetLang}.json`
            .replace(/\s+/g, '_')
            .toLowerCase();

        fs.writeFileSync(fileName, JSON.stringify(topics, null, 2));
        console.log(`✅ Saved ${topics.length} topics to ${fileName}`);
    } catch (err) {
        console.error('❌ Failed to generate topics:', err);
    }
})();
