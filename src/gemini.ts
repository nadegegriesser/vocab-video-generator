import { GoogleGenAI } from '@google/genai';
import { TopicEntry, VocabEntry } from './types';
import mime from 'mime';
import dotenv from 'dotenv';
import { writeFile } from 'fs';

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
    level: string,
    count: number,
    sourceLang: string,
    targetLang: string,
    topic: string
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

export async function synthesizeSpeech(sourceLang: string,
    targetLang: string,
    vocab: VocabEntry) {
    const config = {
        temperature: 1,
        responseModalities: [
            'AUDIO',
        ],
        speechConfig: {
            multiSpeakerVoiceConfig: {
                speakerVoiceConfigs: [
                    {
                        speaker: 'Speaker1',
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: 'Fenrir'
                            }
                        }
                    },
                    {
                        speaker: 'Speaker2',
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: 'Gacrux'
                            }
                        }
                    },
                ]
            },
        },
    };
    const text = `Make Speaker1 speak ${sourceLang} and Speaker2 speak ${targetLang}, wait 1 second before and after each sentence:
Speaker1: ${vocab.source}
Speaker2: ${vocab.target}
Speaker1: ${vocab.exampleSource}
Speaker2: ${vocab.exampleTarget}`;
    console.log(text);
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: config
    });
    console.log(response);
    const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (inlineData) {
        console.log(inlineData.mimeType);
        return Buffer.from(inlineData.data || '', 'base64');
    }
    return;
}
