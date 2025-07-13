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
    console.log(prompt);

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

export async function generateIntroForTopic(
    name1: string,
    style1: string,
    name2: string,
    style2: string,
    level: string,
    sourceLang: string,
    targetLang: string,
    topic: TopicEntry
): Promise<string[]> {
    const prompt = `
${name1} is a female teacher for ${sourceLang} language. She is ${style1}.
${name2} is her male assistant for translating into ${targetLang} language. He is ${style2}.
Generate an introductory sentence for the topic "${topic.source}" in ${sourceLang} for language learners at ${level} level for ${name1}.
Generate an introductory sentence for the topic "${topic.target}" in ${targetLang} for language learners at ${level} level for ${name2}.
Return as JSON object with keys: source, target.
  `;
    console.log(prompt);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
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
    });

    console.log(response.text);
    const entry = <VocabEntry>JSON.parse(response.text!);
    return [entry.source, entry.target];
}

export async function generateVocabForTopic(
    level: string,
    count: number,
    sourceLang: string,
    targetLang: string,
    topic: TopicEntry
): Promise<string[][]> {
    const prompt = `
Generate ${count} vocabulary entries for the topic "${topic.source}" in ${sourceLang} for language learners at ${level} level.
For nouns add a defined article writter in lowercase. Do not add anything in parenthesis after the word.
The topics should be relevant for learners of ${sourceLang} translating into ${targetLang}.
For each word, provide:
- The word in ${sourceLang}
- Its translation in ${targetLang}
- Example sentence in ${sourceLang}
- Its translation in ${targetLang}
Return as JSON array of objects with keys: source, target, exampleSource, exampleTarget.
  `;
    console.log(prompt);

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
                    propertyOrdering: ["source", "target", "exampleSource", "exampleTarget"]
                }
            }
        }
    });

    console.log(response.text);
    const entries = <VocabEntry[]>JSON.parse(response.text!);
    return entries.map(entry => [entry.source, entry.target, entry.exampleSource, entry.exampleTarget]);
}

export async function generateOutroForTopic(
    name1: string,
    style1: string,
    name2: string,
    style2: string,
    level: string,
    sourceLang: string,
    targetLang: string,
    topic: TopicEntry
): Promise<string[]> {
    const prompt = `
${name1} is a female teacher for ${sourceLang} language. She is ${style1}.
${name2} is her male assistant for translating into ${targetLang} language. He is ${style2}.
Generate an conclusion sentence for the topic "${topic.source}" in ${sourceLang} for language learners at ${level} level for ${name1}.
Generate an conclusion sentence for the topic "${topic.target}" in ${targetLang} for language learners at ${level} level for ${name2}.
Return as JSON object with keys: source, target.
  `;
    console.log(prompt);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
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
    });

    console.log(response.text);
    const entry = <VocabEntry>JSON.parse(response.text!);
    return [entry.source, entry.target];
}

export async function synthesizeSpeech(
    name1: string,
    voice1: string,
    style1: string,
    name2: string,
    voice2: string,
    style2: string,
    sourceLang: string,
    targetLang: string,
    vocab: string[]) {
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
                                voiceName: voice1
                            }
                        }
                    },
                    {
                        speaker: 'Speaker2',
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: voice2
                            }
                        }
                    },
                ]
            },
        },
    };
    let text = `STYLE DESCRIPTION:
${name1}: speaks ${sourceLang} language. She is ${style1}.
${name2}: speaks ${targetLang} language. He is ${style2}.
SCRIPT:`;
    let i = 0;
    for (const v of vocab) {
        text += `
${i % 2 == 0 ? name1 : name2}: ${v}`;
        i++;
    }
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
