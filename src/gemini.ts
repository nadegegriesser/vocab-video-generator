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

export async function synthesizeSpeech(level: string,
    sourceLang: string,
    targetLang: string,
    vocab: VocabEntry) {
    const config = {
        temperature: 2,
        responseModalities: [
            'audio',
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
Speaker1: ${vocab.exampleSource}`;
    console.log(text);
    const response = await ai.models.generateContentStream({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: config
    });
    let fileIndex = 0;
    for await (const chunk of response) {
        if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
            continue;
        }
        if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
            const fileName = `${fileIndex++}`;
            const inlineData = chunk.candidates[0].content.parts[0].inlineData;
            let fileExtension = mime.getExtension(inlineData.mimeType || '');
            let buffer = Buffer.from(inlineData.data || '', 'base64');
            if (!fileExtension) {
                fileExtension = 'wav';
                buffer = convertToWav(inlineData.data || '', inlineData.mimeType || '');
            }
            const filePath = `data/${sourceLang}-${targetLang}/${level}/${fileName}.${fileExtension}`;
            saveBinaryFile(filePath, buffer);
        }
        else {
            console.log(chunk.text);
        }
    }
}

function saveBinaryFile(fileName: string, content: Buffer) {
  writeFile(fileName, content, 'utf8', (err) => {
    if (err) {
      console.error(`Error writing file ${fileName}:`, err);
      return;
    }
    console.log(`File ${fileName} saved to file system.`);
  });
}

interface WavConversionOptions {
    numChannels: number,
    sampleRate: number,
    bitsPerSample: number
}

function convertToWav(rawData: string, mimeType: string) {
    const options = parseMimeType(mimeType)
    const wavHeader = createWavHeader(rawData.length, options);
    const buffer = Buffer.from(rawData, 'base64');

    return Buffer.concat([wavHeader, buffer]);
}

function parseMimeType(mimeType: string) {
    const [fileType, ...params] = mimeType.split(';').map(s => s.trim());
    const [_, format] = fileType.split('/');

    const options: Partial<WavConversionOptions> = {
        numChannels: 1,
    };

    if (format && format.startsWith('L')) {
        const bits = parseInt(format.slice(1), 10);
        if (!isNaN(bits)) {
            options.bitsPerSample = bits;
        }
    }

    for (const param of params) {
        const [key, value] = param.split('=').map(s => s.trim());
        if (key === 'rate') {
            options.sampleRate = parseInt(value, 10);
        }
    }

    return options as WavConversionOptions;
}

function createWavHeader(dataLength: number, options: WavConversionOptions) {
    const {
        numChannels,
        sampleRate,
        bitsPerSample,
    } = options;

    // http://soundfile.sapp.org/doc/WaveFormat

    const byteRate = sampleRate * numChannels * bitsPerSample / 8;
    const blockAlign = numChannels * bitsPerSample / 8;
    const buffer = Buffer.alloc(44);

    buffer.write('RIFF', 0);                      // ChunkID
    buffer.writeUInt32LE(36 + dataLength, 4);     // ChunkSize
    buffer.write('WAVE', 8);                      // Format
    buffer.write('fmt ', 12);                     // Subchunk1ID
    buffer.writeUInt32LE(16, 16);                 // Subchunk1Size (PCM)
    buffer.writeUInt16LE(1, 20);                  // AudioFormat (1 = PCM)
    buffer.writeUInt16LE(numChannels, 22);        // NumChannels
    buffer.writeUInt32LE(sampleRate, 24);         // SampleRate
    buffer.writeUInt32LE(byteRate, 28);           // ByteRate
    buffer.writeUInt16LE(blockAlign, 32);         // BlockAlign
    buffer.writeUInt16LE(bitsPerSample, 34);      // BitsPerSample
    buffer.write('data', 36);                     // Subchunk2ID
    buffer.writeUInt32LE(dataLength, 40);         // Subchunk2Size

    return buffer;
}
