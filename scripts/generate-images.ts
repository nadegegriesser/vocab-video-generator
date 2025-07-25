import fs from 'fs';
import { generateImage } from '../src/gemini.js';
import { TopicEntry } from '../src/types.js';
import { loadFile } from '../src/file.js';
import sharp from 'sharp';

const args = process.argv.slice(2);
const color = args[0];
const dir = args[1];
const topicsFile = 'topics.json';
const topicsPath = `${dir}/${topicsFile}`;

(async () => {
    try {
        let t = 0;
        for (const topic of loadFile<TopicEntry>(topicsPath)) {
            console.log(topic);
            t++;
            const tIndex = String(t).padStart(2, '0');
            const vocabDir = `${dir}/${tIndex}`;

            const jpgFile = `${vocabDir}/image.jpg`;
            if (fs.existsSync(jpgFile)) {
                const jpgImage = sharp(jpgFile);
                const metadata = await jpgImage.metadata();
                if (metadata.width != 1280 || metadata.height != 720) {
                    console.log('wrong dims');
                    fs.unlinkSync(jpgFile);
                } else {
                    console.log(`✅ ${jpgFile} already exists, skipping...`);
                    continue;
                }
            }

            const image = await generateImage(topic.source, color);
            if (image) {
                const pngFile = `${vocabDir}/image.png`;
                fs.writeFileSync(pngFile, image);
                const pngImage = sharp(pngFile);
                const metadata = await pngImage.metadata();
                const ratio = metadata.width / metadata.height;
                if (ratio > Math.floor(16/9) && ratio < Math.ceil(16/9)) {
                    await pngImage
                        .resize(1280, 720)
                        .jpeg({ quality: 90 })
                        .toFile(jpgFile);
                } else {
                    console.error('❌ Wrong dimensions', metadata.width, metadata.height);
                }
                fs.unlinkSync(pngFile);
            }
            return;
        }
    } catch (err) {
        console.error('❌ Failed to generate vocab:', err);
    }
})();
