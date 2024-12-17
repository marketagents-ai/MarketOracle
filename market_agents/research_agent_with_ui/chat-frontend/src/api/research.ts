import axios from 'axios';
import { ResearchResult } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

export const researchApi = {
  search: async (query: string): Promise<ResearchResult> => {
    try {
      const response = await axios.post<ResearchResult>(
        `${API_BASE_URL}/research/search`,
        { query }
      );
      return response.data;
    } catch (error) {
      console.error('Research Search Error:', error);
      throw error;
    }
  },

  getHistory: async (): Promise<ResearchResult[]> => {
    try {
      const response = await axios.get<ResearchResult[]>(
        `${API_BASE_URL}/research/history`
      );
      return response.data;
    } catch (error) {
      console.error('Research History Error:', error);
      throw error;
    }
  }
};