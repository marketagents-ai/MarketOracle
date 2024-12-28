import type { ResearchData } from './research';

export type ChatMode = 'custom' | 'research';

export interface ChatItem {
  isUser: boolean;
  content: string | ResearchData;
  timestamp: Date;
  mode: ChatMode;
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatItem[];
  mode: ChatMode;
  createdAt: Date;
  updatedAt: Date;
}