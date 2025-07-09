import { generateAudioList } from '../src/file.js';
import { FfmpegCommand } from 'fluent-ffmpeg';

const args = process.argv.slice(2);
const dir = args[0];


(async () => {
    try {
        generateAudioList(dir);
        new FfmpegCommand()
            .input('data/image.jpg')
            .input('${dir}/image.jpg')
            .videoFilters("drawtext=text='Dein Text':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2")
            .output('output.mp4')
            .run();
    } catch (err) {
        console.error('❌ Failed to generate video:', err);
    }
})();
