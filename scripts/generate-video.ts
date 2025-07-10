import { loadFile } from '../src/file.js';
import { VocabEntry } from '../src/types.js';
import { exec } from 'child_process';

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
            const commands = [`echo "${vocab.source}" > textfile.txt`,
                `ffmpeg -y -loop 1 -i data/image.jpg -i ${dir}/audio/${index}.wav -vf "drawtext=textfile=textfile.txt:fontcolor=white:fontsize=32:x=(w-text_w)/2:y=(h-text_h)/2" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -shortest -pix_fmt yuv420p ${dir}/audio/${index}.mp4`,
                'rm textfile.txt'];
            for (const command of commands) {
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`exec error: ${error}`);
                        return;
                    }
                    console.log(`stdout: ${stdout}`);
                    console.error(`stderr: ${stderr}`);
                });
            }
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
