import axios from 'axios';

import type { Chat, Message, LLMConfig, SystemPrompt, SystemPromptCreate } from '../types';
import { API_BASE_URL } from './config';

export interface ChatApi {
  getChats: () => Promise<Chat[]>;
  sendMessage: (chatId: number, message: string, config?: LLMConfig) => Promise<Message>;
  getChatHistory: (chatId: number) => Promise<Message[]>;
  createSystemPrompt: (prompt: SystemPromptCreate) => Promise<SystemPrompt>;
  getChat: (chatId: number) => Promise<Chat>;
  getLLMConfig: (chatId: number) => Promise<LLMConfig>;
  setStopTool: (chatId: number, toolId: number) => Promise<void>;
  removeStopTool: (chatId: number) => Promise<void>;
}

// Implement the ChatApi interface
export const chatApi: ChatApi = {
  getChats: async () => {
    const response = await fetch('/api/chats');
    return response.json();
  },
  // ... implement other methods
};