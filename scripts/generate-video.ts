import fs from 'fs';
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
                .loop(1)
                /*.videoFilters([{
                    filter: 'drawtext',
                    options: {
                        text: vocab.source,
                        fontcolor: 'red',
                        fontsize: 32,
                        x: '(w-text_w)/2',
                        y: '(h-text_h)/2'
                    }
                }])*/
                .videoCodec('libx264')
                .audioCodec('aac')
                .audioBitrate('192k')
                .outputOption('-pix_fmt yuv420p')
                .on('start', (cmdline) => console.log('>>>> CMD', cmdline))
                .on('error', (cmdline) => console.log('>>>> CMD', cmdline))
                .save(`${dir}/audio/${index}.mp4`);
            return;

            /*ffmpeg -y -loop 1 -i ../../../../image.jpg -i combined.wav \
                      #  -vf "drawtext=text='Dein Text':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2" \
                      #  -c:v libx264 -tune stillimage -c:a aac -b:a 192k -shortest -pix_fmt yuv420p output.mp4 */
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
