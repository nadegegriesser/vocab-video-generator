import fs from 'fs';
import { generateAskForSubscription, generateIntroForTopic, generateOutroForTopic, generateVocabForTopic } from '../src/gemini.js';
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

async function createSubTextDir(textDir: string, v: number) {
    const vIndex = String(v).padStart(2, '0');
    const subTextDir = `${textDir}/${vIndex}`;

    if (fs.existsSync(subTextDir)) {
        console.log(`✅ ${subTextDir} already exists, skipping...`);
        return undefined;
    }

    fs.mkdirSync(subTextDir, { recursive: true });
    return subTextDir;
}

async function handleData(subTextDir: string, datas: string[]) {
    let vt = 0;
    for (const data of datas) {
        const vtIndex = String(vt).padStart(2, '0');
        fs.writeFileSync(`${subTextDir}/${vtIndex}.txt`, data.replaceAll(' \?', '?').replaceAll(' \!', '!').replaceAll(' \.', '.'));
        vt++;
    }
}

(async () => {
    try {
        let t = 0;
        for (const topic of loadFile<TopicEntry>(topicsPath)) {
            console.log(topic);
            t++;
            const tIndex = String(t).padStart(2, '0');
            const vocabDir = `${dir}/${tIndex}`;
            const textDir = `${vocabDir}/text`;
            const scriptDir = `${vocabDir}/script`;

            let v = 0;
            let subTextDir = await createSubTextDir(textDir, v);
            let subScriptDir = await createSubTextDir(scriptDir, v);
            if (subTextDir && subScriptDir) {
                const intros = await generateIntroForTopic(name1, style1, name2, style2, level, sourceLang, targetLang, topic);
                await handleData(subTextDir, [topic.source, topic.target]);
                await handleData(subScriptDir, intros);
            }

            for (const vocabs of await generateVocabForTopic(level, count, sourceLang, targetLang, topic)) {
                v++;
                subTextDir = await createSubTextDir(textDir, v);
                subScriptDir = await createSubTextDir(scriptDir, v);
                if (subTextDir && subScriptDir) {
                    await handleData(subTextDir, vocabs);
                    await handleData(subScriptDir, vocabs);
                }
            }

            v++;
            subTextDir = await createSubTextDir(textDir, v);
            subScriptDir = await createSubTextDir(scriptDir, v);
            if (subTextDir && subScriptDir) {
                const outros = await generateOutroForTopic(name1, style1, name2, style2, level, sourceLang, targetLang, topic);
                await handleData(subTextDir, [topic.source, topic.target]);
                await handleData(subScriptDir, outros);
            }

            v++;
            subTextDir = await createSubTextDir(textDir, v);
            subScriptDir = await createSubTextDir(scriptDir, v);
            if (subTextDir && subScriptDir) {
                const sub = await generateAskForSubscription(name1, style1, level, sourceLang);
                await handleData(subTextDir, sub);
                await handleData(subScriptDir, ['']);
                return;
            }
        }
    } catch (err) {
        console.error('❌ Failed to generate vocab:', err);
    }
})();
