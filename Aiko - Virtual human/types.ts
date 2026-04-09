export enum Emotion {
  NEUTRAL = 'neutral',
  HAPPY = 'happy',
  SHY = 'shy',
  SAD = 'sad',
  CRYING = 'crying',
  EMBARRASSED = 'embarrassed',
  EXCITED = 'excited',
  ANGRY = 'angry',
  SURPRISED = 'surprised',
  CURIOUS = 'curious',
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'assistant' | 'system';
  text: string;
  emotion?: Emotion;
  timestamp: number;
  hasImage?: boolean;
}

export interface AIResponse {
  text: string;
  emotion: Emotion;
}

export interface VisualState {
  emotion: Emotion;
  isTalking: boolean;
}

export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  PROCESSING = 'processing',
  SPEAKING = 'speaking',
  LISTENING = 'listening',
}