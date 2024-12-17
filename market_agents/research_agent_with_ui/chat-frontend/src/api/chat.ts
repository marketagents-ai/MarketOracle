import axios from 'axios';
import type { Message, LLMConfig } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

export const chatApi = {
  getChats: async () => {
    const response = await axios.get(`${API_BASE_URL}/chats/`);
    return response.data;
  },

    sendMessage: async (chatId: number, message: string, config?: LLMConfig): Promise<Message> => {
        const response = await axios.post(`${API_BASE_URL}/chats/${chatId}/messages/`, {
            content: message,
            config
        });
        return response.data as Message;
    },

    getChatHistory: async (chatId: number): Promise<Message[]> => {
        const response = await axios.get(`${API_BASE_URL}/chats/${chatId}/messages/`);
        return response.data as Message[];
    },
};