import { GoogleGenAI } from '@google/genai';
import { FileWriter } from 'wav';
import { TopicEntry, VocabEntry } from './types';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ vertexai: false, apiKey: process.env.GEMINI_API_KEY });

export async function generateTopics(
    level: string,
    count: number,
    sourceLang: string,
    targetLang: string
): Promise<TopicEntry[]> {
    const prompt = `
Generate ${count} vocabulary topics for ${sourceLang} language learners at ${level} level.
The topics should be relevant for learners of ${sourceLang} translating into ${targetLang}.
For each topic, provide:
- Topic name in ${sourceLang}
- Its translation in ${targetLang}
Return as JSON array with keys: source, target.
  `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    return <TopicEntry[]>JSON.parse(response.text!.replace('```json', '').replace('```', ''));
}

export async function generateVocabForTopic(
    topic: string,
    level: string,
    count: number,
    sourceLang: string,
    targetLang: string
): Promise<VocabEntry[]> {
    const prompt = `
Generate ${count} vocabulary entries for the topic "${topic}" in ${sourceLang} for language learners at ${level} level.
For nouns add an article.
The topics should be relevant for learners of ${sourceLang} translating into ${targetLang}.
For each word, provide:
- The word in ${sourceLang}
- Its translation in ${targetLang}
- Example sentence in ${sourceLang}
- Its translation in ${targetLang}
Return as JSON array of objects with keys: source, target, exampleSource, exampleTarget.
  `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    return <VocabEntry[]>JSON.parse(response.text!.replace('```json', '').replace('```', ''));
}

export async function synthesizeSpeech(text: string, fileName: string) {
    console.log(text);
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say cheerfully: ${text}` }] }],
        config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' }
                }
            }
        }
    });
    console.log(response);
    const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data!;
    console.log(data);
    const audioBuffer = Buffer.from(data, 'base64');

    await saveWaveFile(fileName, audioBuffer);
}

async function saveWaveFile(
    filename: string,
    pcmData: any,
    channels = 1,
    rate = 24000,
    sampleWidth = 2,
) {
    return new Promise((resolve, reject) => {
        const writer = new FileWriter(filename, {
            channels,
            sampleRate: rate,
            bitDepth: sampleWidth * 8,
        });

        writer.on('finish', resolve);
        writer.on('error', reject);

        writer.write(pcmData);
        writer.end();
    });
}

