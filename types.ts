
export enum AppState {
  IDLE,
  RECORDING,
  PROCESSING,
  RESULT
}

export interface DreamInterpretation {
  theme: string;
  symbols: {
    name: string;
    meaning: string;
    archetype: string;
  }[];
  interpretation: string;
}

export interface DreamAnalysisData {
  transcription: string;
  imageUrl: string;
  interpretation: DreamInterpretation;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
