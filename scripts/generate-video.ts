import { generateAudioList } from '../src/file.js';

const args = process.argv.slice(2);
const dir = args[0];


(async () => {
    try {
        generateAudioList(dir);
    } catch (err) {
        console.error('❌ Failed to generate video:', err);
    }
})();
