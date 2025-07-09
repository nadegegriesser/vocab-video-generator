import { loadFile } from '../src/file.js';
import FfmpegCommand from 'fluent-ffmpeg';
import { VocabEntry } from '../src/types.js';

const args = process.argv.slice(2);
const dir = args[0];
const vocabPath = `${dir}/vocab.json`;


(async () => {
    try {
        let i = 0;
        for (const vocab of loadFile<VocabEntry>(vocabPath)) {
            console.log(vocab);
            //generateAudioList(dir);
            const index = String(i).padStart(2, '0');
            FfmpegCommand()
                .input('data/image.jpg')
                .input(`${dir}/audio/${index}.wav`)
                .videoFilters(`drawtext="text='${vocab.source}':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2"`)
                .output(`${dir}/audio/output.mp4`)
                .run();
                return;
        }
        /* new FfmpegCommand()
            .input('data/image.jpg')
            .input('combined.wav')
            .videoFilters("drawtext=text='Dein Text':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2")
            .output('output.mp4')
            .run(); */
    } catch (err) {
        console.error('❌ Failed to generate video:', err);
    }
})();
