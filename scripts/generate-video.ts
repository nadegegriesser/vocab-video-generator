import { generateAudioList } from '../src/file.js';
import { ffmpeg } from 'fluent-ffmpeg';

const args = process.argv.slice(2);
const dir = args[0];


(async () => {
    try {
        generateAudioList(dir);
        ffmpeg('')
         .videoFilters("drawtext=text='Dein Text':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2")
         .output('output.mp4')
         .run();
    } catch (err) {
        console.error('❌ Failed to generate video:', err);
    }
})();
