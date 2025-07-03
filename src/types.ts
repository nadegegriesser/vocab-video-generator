export interface TopicEntry {
  source: string;         // Topic in the source language
  target: string;         // Topic in the target language
}

export interface VocabEntry {
  source: string;         // Word in the source language (e.g. "chien")
  target: string;         // Translation in the target language (e.g. "Hund")
  exampleSource: string;  // Example sentence in source language
  exampleTarget: string;  // Translated example sentence
}