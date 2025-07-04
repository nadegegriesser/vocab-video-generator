import fs from 'fs';

export function loadFile<Type>(path: string): Type[] {
    if (!fs.existsSync(path)) {
        return [];
    }
    const raw = fs.readFileSync(path, 'utf-8');
    return <Type[]>JSON.parse(raw);
}