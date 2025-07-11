import fs from 'fs';
import { generateIntroForTopic, generateOutroForTopic, generateTextForTopic, generateVocabForTopic } from '../src/gemini.js';
import { TopicEntry } from '../src/types.js';
import { loadFile } from '../src/file.js';

const args = process.argv.slice(2);
const name1 = args[0];
const style1 = args[1];
const name2 = args[2];
const style2 = args[3];
const count = parseInt(args[4] || '30', 10);
const level = args[5] || 'A1';
const sourceLang = args[6] || 'fr';
const targetLang = args[7] || 'de';
const dir = args[8] || `data/${sourceLang}-${targetLang}/${level}`;
const topicsFile = 'topics.json';
const topicsPath = `${dir}/${topicsFile}`;

async function generateText(filePath: string, topic: TopicEntry) {
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${filePath} already exists, skipping...`);
        return;
    }

    const vocabs = await generateTextForTopic(name1, style1, name2, style2, level, count, sourceLang, targetLang, topic);

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
            const textDir = `${vocabDir}/text`;

            fs.mkdirSync(textDir, { recursive: true });
            

            const vIndex = audioFile.slice(0, audioFile.lastIndexOf('.'));
            const subTextDir = `${textDir}/${vIndex}`;

            const intros = await generateIntroForTopic(name1, style1, name2, style2, level, sourceLang, targetLang, topic);
            for (const data of intros) {
                fs.writeFileSync(filePath, data);
            }

            for (const vocabs of await generateVocabForTopic(level, count, sourceLang, targetLang, topic)) {
                for (const data of vocabs) {
                    fs.writeFileSync(filePath, data);
                }
            }

            const outros = await generateOutroForTopic(name1, style1, name2, style2, level, sourceLang, targetLang, topic);
            for (const data of outros) {
                fs.writeFileSync(filePath, data);
            }
        }
    }
    } catch (err) {
    console.error('❌ Failed to generate vocab:', err);
}
}) ();
