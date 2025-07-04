import fs from 'fs';
import path from 'path';

export function loadFile<Type>(path: string): Type[] {
    if (!fs.existsSync(path)) {
        return [];
    }
    const raw = fs.readFileSync(path, 'utf-8');
    return <Type[]>JSON.parse(raw);
}

export function generateAudioList(dir: string) {
  const files = fs.readdirSync(dir)
    .filter(file => file.endsWith('.wav'))
    .sort(); 

  if (files.length === 0) {
    console.error('❌ No .wav files found in', dir);
    process.exit(1);
  }

  const lines = files.map(file => `file '${file}'`);
  fs.writeFileSync(`${path}/audio-list.txt`, lines.join('\n'));
  console.log(`✅ Generated ${path}/audio-list.txt with ${files.length} entries.`);
}