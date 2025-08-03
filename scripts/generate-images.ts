import fs from 'fs';
import { generateImage, generateImageSet, removeBackground } from '../src/gemini.js';
import { TopicEntry } from '../src/types.js';
import { loadFile } from '../src/file.js';
import sharp from 'sharp';
import { execSync } from 'child_process';

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
            let prompts = [];
            for (let hair of ['slick bun', 'messy bun', 'ponytail', 'braid']) {
                for (let clothes of ['blouse', 'lace top', 'blazer']) {
                    prompts.push(
                        'Generate a 1280x720 pixels landscape image with a solid green background (#00FF00) for later removal. '
                        + 'Add a photorealistic representation of Maîtresse Dominique at the bottom-right corner. '
                        + 'The center of the image must remain free to add text later. '
                        + `She is a fictional French teacher in her late 20s. Brown eyes, olive skin. Wearing a white ${clothes}, elegant and tasteful. `
                        + `Her brown hair is in a professional ${hair} and she has sharp red lipstick and clear stylish full-rimmed black glasses. `
                        + 'She is shown from the waist up and looking at the person viewing the image with a confident, self assured, slightly amused expression. '
                        + 'Remove any glare or reflection on the lenses. Make the eyes symetric, fully visible and realistic. Correct any distortion caused by the lenses.',
                    );
                }
            }
            prompts.push(
                'Generate a 1280x720 pixels landscape image with a solid green background (#00FF00) for later removal. '
                + 'Add a photorealistic representation of Maîtresse Dominique, shown from the waist up, at the center of the picture. '
                + 'She is a fictional French teacher in her late 20s. Brown eyes, olive skin. Wearing a white blouse, slightly open, elegant and tasteful. '
                + 'Her brown hair is loose and wavy and she has sharp red lipstick and has taken off her glasses. '
                + 'She is looking at the viewer with a confident, self assured, slightly amused expression asking for subscriptions or likes that she will definitely get.'
            );
            prompts.push(
                'Generate a 1280x720 pixels landscape image with a solid green background (#00FF00) for later removal. '
                + 'Add a photorealistic representation of Maîtresse Dominique, shown from the waist up, at the center of the picture. '
                + 'She is a fictional French teacher in her late 20s. Brown eyes, olive skin. Wearing a white blouse, slightly open, elegant and tasteful. '
                + 'Her brown hair is loose and wavy and she has sharp red lipstick and has taken off her glasses. '
                + 'She is winking at the viewer with a confident, self assured, slightly amused expression asking for subscriptions or likes that she will definitely get.'
            );
            let p = 0;
            for (let prompt of prompts) {
                const pngFile = `${imagesDir}/${p}.png`;
                const pngFileNoBg = `${imagesDir}/${p}_no_bg.png`;
                if (!fs.existsSync(pngFile)) {
                    const image = await generateImageSet(prompt, 'data/images/no_glasses.png');
                    if (image) {
                        fs.writeFileSync(pngFile, image);
                        const pngImage = sharp(pngFile);
                        const metadata = await pngImage.metadata();
                        const ratio = metadata.width / metadata.height;
                        if (ratio > Math.floor(16 / 9) && ratio < Math.ceil(16 / 9)) {
                            await pngImage
                                .resize(1280, 720)
                                .withMetadata()
                                .toFile(pngFile + '_');
                            fs.unlinkSync(pngFile);
                            fs.renameSync(pngFile + '_', pngFile);
                        } else {
                            console.error('❌ Wrong dimensions', metadata.width, metadata.height);
                            fs.unlinkSync(pngFile);
                        }
                    }
                }
                if (fs.existsSync(pngFile) && !fs.existsSync(pngFileNoBg)) {
                    execSync(`rembg i ${pngFile} ${pngFileNoBg}`);
                    await sharp(pngFileNoBg)
                        .ensureAlpha()
                        .trim()
                        .withMetadata()
                        .toFile(pngFileNoBg + '_');
                    await sharp(pngFileNoBg + '_')
                        .resize({height: Math.floor(720 * 2 / 3)})
                        .withMetadata()
                        .toFile(pngFileNoBg);
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
