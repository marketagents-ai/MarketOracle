import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import axios from 'axios';
import type { ResearchResult } from './types'; 

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

export const chatapi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const researchApi = {
  performResearch: async (query: string): Promise<ResearchResult> => {
    try {
      const response = await chatapi.post('/research/search', { query });
      return response.data;
    } catch (error) {
      console.error('Research API Error:', error);
      throw error;
    }
  },

  getResearchHistory: async (): Promise<ResearchResult[]> => {
    try {
      const response = await chatapi.get('/research/history');
      return response.data;
    } catch (error) {
      console.error('Research History Error:', error);
      throw error;
    }
  },

  cancelResearch: async (searchId: string): Promise<void> => {
    try {
      await chatapi.post(`/research/cancel/${searchId}`);
    } catch (error) {
      console.error('Cancel Research Error:', error);
      throw error;
    }
  }
};
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

