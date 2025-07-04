import { GoogleGenAI, Type } from '@google/genai';
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
The topics must be formulated as titles and follow capitalization rules in the specific language.
For each topic, provide:
- Topic name in ${sourceLang}
- Its translation in ${targetLang}
Return as JSON array with keys: source, target.
  `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        source: {
                            type: Type.STRING
                        },
                        target: {
                            type: Type.STRING
                        }
                    },
                    propertyOrdering: ["source", "target"]
                }
            }
        }
    });

    console.log(response.text);
    return <TopicEntry[]>JSON.parse(response.text!);
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
For nouns add a defined article writter in lowercase. Do not add anything in parenthesis after the word.
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
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        source: {
                            type: Type.STRING
                        },
                        target: {
                            type: Type.STRING
                        },
                        exampleSource: {
                            type: Type.STRING
                        },
                        exampleTarget: {
                            type: Type.STRING
                        }
                    },
                    propertyOrdering: ["source", "target"]
                }
            }
        }
    });

    console.log(response.text);
    return <VocabEntry[]>JSON.parse(response.text!);
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
                                voiceName: 'Erinome'
                            }
                        }
                    },
                    {
                        speaker: 'Speaker2',
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: 'Leda'
                            }
                        }
                    },
                ]
            },
        },
    };
    const text = `STYLE DESCRIPTION:
Speaker 1: Speaks in ${sourceLang} language. Read aloud in a warm, welcoming tone.
Speaker 2: Speaks in ${targetLang} language. Read aloud in a warm, welcoming tone.
SCRIPT:
Speaker1: -- ${vocab.source}
Speaker2: ${vocab.target} 
Speaker1: -- ${vocab.exampleSource}
Speaker2: ${vocab.exampleTarget} -- `;
    console.log(text);
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: config
    });
    console.log(response);
    const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (data) {
        return Buffer.from(data, 'base64');
    }
    return;
}
