import fs from 'fs';

export function loadFile<Type>(filePath: string): Type[] {
    if (!fs.existsSync(filePath)) {
        return [];
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return <Type[]>JSON.parse(raw);
}

export function generateAudioList(dirPath: string) {
  const files = fs.readdirSync(dirPath)
    .filter(file => file.endsWith('.wav') && file != 'combined.wav')
    .sort(); 

  if (files.length === 0) {
    console.error('❌ No .wav files found in', dirPath);
    return;
  }

  const lines = files.map(file => `file '${file}'`);
  fs.writeFileSync(`${dirPath}/audio-list.txt`, lines.join('\n'));
  console.log(`✅ Generated ${dirPath}/audio-list.txt with ${files.length} entries.`);
}