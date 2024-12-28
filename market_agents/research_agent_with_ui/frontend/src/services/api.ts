import { APIError } from '../utils/api';
import type { ResearchData } from '../types/research';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const fetchResearch = async (query: string, urls?: string[]): Promise<ResearchData[]> => {
  try {
    const response = await fetch(`${API_URL}/api/research`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, urls }),
    });

    if (!response.ok) {
      throw new APIError('Failed to fetch research data', response.status);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError('An unexpected error occurred');
  }
};