// chat-frontend/src/api/research.ts
import axios from 'axios';
import { ResearchResult } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

export const researchApi = {
  async performResearch(query: string, config = {}): Promise<ResearchResult> {
    try {
      const response = await axios.post(`${API_BASE_URL}/research`, {
        query,
        config
      });
      return response.data;
    } catch (error) {
      console.error('Research Error:', error);
      throw error;
    }
  },

  async getResearchHistory(): Promise<ResearchResult[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/research/history`);
      return response.data;
    } catch (error) {
      console.error('Research History Error:', error);
      throw error;
    }
  }
};