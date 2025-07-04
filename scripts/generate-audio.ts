import fs from 'fs';
import { synthesizeSpeech } from '../src/gemini.js';
import { TopicEntry, VocabEntry } from '../src/types.js';
import { loadFile } from '../src/file.js';
import wav from 'wav';

const args = process.argv.slice(2);
const sourceLang = args[0] || 'fr';
const targetLang = args[1] || 'de';
const dir = args[2];
const topicsFile = 'topics.json';
const topicsPath = `${dir}/${topicsFile}`;

async function saveWaveFile(
    filePath: string,
    pcmData: any,
    channels = 1,
    rate = 24000,
    sampleWidth = 2,
) {
    return new Promise((resolve, reject) => {
        const writer = new wav.FileWriter(filePath, {
            channels,
            sampleRate: rate,
            bitDepth: sampleWidth * 8,
        });

        writer.on('finish', resolve);
        writer.on('error', reject);

        writer.write(pcmData);
        writer.end();
    });
}

(async () => {
    try {
        let t = 0;
        for (const topic of loadFile<TopicEntry>(topicsPath)) {
            t++;
            const index = String(t).padStart(2, '0');
            const topicDir = `${dir}/${index}`;
            const audioDir = `${topicDir}/audio`;
            fs.mkdirSync(audioDir, { recursive: true });

            const topicAudioPath = `${audioDir}/topic2.wav`;
            if (fs.existsSync(topicAudioPath)) {
                console.log(`✅ ${topicAudioPath} already exists, skipping...`);
            } else {
                let buffer = await synthesizeSpeech(sourceLang, targetLang, {
                    source: "Prêt à débloquer de nouveaux mots ? Allez, on booste ton vocabulaire comme un pro!",
                    target: "Bereit, neue Wörter freizuschalten? Los geht's - wir boosten deinen Wortschatz wie ein Profi!",
                    exampleSource: topic.source,
                    exampleTarget: topic.target
                });
                if (buffer) {
                    await saveWaveFile(topicAudioPath, buffer);
                }
                return;
            }
            const vocabPath = `${topicDir}/vocab.json`;
            let v = 0;
            for (const vocab of loadFile<VocabEntry>(vocabPath)) {
                console.log(vocab);
                v++;
                const index = String(v).padStart(2, '0');
                const audioPath = `${audioDir}/${index}.wav`;
                if (fs.existsSync(audioPath)) {
                    console.log(`✅ ${audioPath} already exists, skipping...`);
                    continue;
                }
                let buffer = await synthesizeSpeech(sourceLang, targetLang, vocab);
                if (buffer) {
                    await saveWaveFile(audioPath, buffer);
                }
                return;
            }
        }
    } catch (err) {
        console.error('❌ Failed to generate video:', err);
    }
})();
