import fs from 'fs';
import { generateImage, generateImageSet, removeBackground } from '../src/gemini.js';
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
        const jpgFile = `data/image.jpg`;
        if (!fs.existsSync(jpgFile)) {
            const imagePath = 'data/fr-de/A1/01/images/10.jpg';
            const image = await removeBackground(imagePath);
            if (image) {
                const pngFile = `data/image.png`;
                fs.writeFileSync(pngFile, image);
                const pngImage = sharp(pngFile);
                await pngImage
                    .jpeg({ quality: 100 })
                    .toFile(jpgFile);
                fs.unlinkSync(pngFile);
            }
        }
        const imagesDir = `data/images`;
        if (!fs.existsSync(imagesDir + 'a')) {
            fs.mkdirSync(imagesDir, { recursive: true });
            const prompts = [
                'Photorealistic portrait of Maîtresse Dominique with transparent background. She is a fictional French teacher in her late 20s. Brown eyes, brown hair in bun, olive skin. Wearing a white blouse, elegant and tasteful. Thin, elegant full-rimmed clear glasses. Remove any glare or reflection on the lenses. Make the eyes symetric, fully visible and realistic. Correct any distortion caused by the lenses. Looking confident, slightly amused expression. Transparent background. Consistent lighting and framing.',
                'Photorealistic portrait of Maîtresse Dominique with transparent background. She is a fictional French teacher in her late 20s. Brown eyes, brown hair in ponytail, olive skin. Wearing a white blazer, elegant and tasteful. Thin, elegant full-rimmed clear glasses. Remove any glare or reflection on the lenses. Make the eyes symetric, fully visible and realistic. Correct any distortion caused by the lenses. Looking confident, slightly amused expression. Transparent background. Consistent lighting and framing.',
                'Photorealistic portrait of Maîtresse Dominique with transparent background. She is a fictional French teacher in her late 20s. Brown eyes, brown hair in bun, olive skin. Wearing a white lace top, elegant and tasteful. Thin, elegant full-rimmed clear glasses. Remove any glare or reflection on the lenses. Make the eyes symetric, fully visible and realistic. Correct any distortion caused by the lenses. Looking confident, slightly amused expression. Transparent background. Consistent lighting and framing.',
                'Photorealistic portrait of Maîtresse Dominique with transparent background to ask for likes and channel subscription. She is a fictional French teacher in her late 20s. Brown eyes, loose brown hair, olive skin. Wearing a white V-neck top, slightly open, elegant and tasteful. No glasses. Looking straight forward with confident, slightly amused expression, happy the lesson is over. Transparent background. Consistent lighting and framing.'
            ];
            let p = 4;
            for (let prompt of prompts) {
                const pngFile = `${imagesDir}/${p}.png`;
                if (!fs.existsSync(pngFile)) {
                    const image = await generateImageSet(prompt, 'data/image.jpg');
                    if (image) {
                        fs.writeFileSync(pngFile, image);
                    }
                }
                p++;
            }
            return;
        }

        let t = 0;
        for (const topic of loadFile<TopicEntry>(topicsPath)) {
            let cnt = 0;
            console.log(topic);
            t++;
            const tIndex = String(t).padStart(2, '0');
            const topicDir = `${dir}/${tIndex}`;
            const textDir = `${topicDir}/text`;
            if (!fs.existsSync(textDir)) {
                console.log(`✅ ${textDir} does not exist, skipping...`);
                continue;
            }

            const imageDir = `${topicDir}/images`;

            fs.mkdirSync(imageDir, { recursive: true });

            const subTextDirs = fs.readdirSync(`${textDir}`).sort();
            for (const subTextDir of subTextDirs) {

                const jpgFile = `${imageDir}/${subTextDir}.jpg`;
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

                let vocab = '';
                if (subTextDir == '00') {
                    vocab = 'Introduction';
                }
                else if (subTextDir == String(subTextDirs.length - 1).padStart(2, '0')) {
                    vocab = 'Conclusion';
                }
                else {
                    const textFiles = fs.readdirSync(`${textDir}/${subTextDir}`).sort();
                    if (textFiles.length > 0) {
                        const textFile = textFiles[0];
                        vocab = fs.readFileSync(`${textDir}/${subTextDir}/${textFile}`).toString();
                    }
                }

                const image = await generateImage(topic.source, vocab, color, 'data/image.jpg');
                if (image) {
                    const pngFile = `${imageDir}/${subTextDir}.png`;
                    fs.writeFileSync(pngFile, image);
                    const pngImage = sharp(pngFile);
                    const metadata = await pngImage.metadata();
                    const ratio = metadata.width / metadata.height;
                    if (ratio > Math.floor(16 / 9) && ratio < Math.ceil(16 / 9)) {
                        await pngImage
                            .resize(1280, 720)
                            .jpeg({ quality: 100 })
                            .toFile(jpgFile);
                    } else {
                        console.error('❌ Wrong dimensions', metadata.width, metadata.height);
                    }
                    fs.unlinkSync(pngFile);
                }
                cnt++;
                if (cnt >= 10) {
                    return;
                }
            }
            if (cnt > 0) {
                return;
            }
        }
    } catch (err) {
        console.error('❌ Failed to generate image:', err);
    }
})();
