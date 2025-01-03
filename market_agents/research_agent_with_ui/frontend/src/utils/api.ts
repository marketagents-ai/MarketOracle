// import { toast } from 'react-hot-toast';

export class APIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'APIError';
  }
}

export const handleAPIError = (error: unknown): string => {
  console.error('API Error:', error);
  if (error instanceof APIError) {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
};

// import { APIError } from '../utils/api';
import type { ResearchData } from '../types/research';
import type { Chat, ChatItem, ChatMode } from '../types/chat';
import type { SystemMessage } from '../types/system';
import type { CustomTool } from '../types/tools';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Chat related API calls
export const fetchChats = async (): Promise<Chat[]> => {
  try {
    const response = await fetch(`${API_URL}/api/chats`);
    if (!response.ok) {
      throw new APIError('Failed to fetch chats', response.status);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError('An unexpected error occurred');
  }
};

export const createChat = async (mode: ChatMode): Promise<Chat> => {
  try {
    const response = await fetch(`${API_URL}/api/chats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mode }),
    });
    if (!response.ok) {
      throw new APIError('Failed to create chat', response.status);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError('An unexpected error occurred');
  }
};

export const updateChat = async (chatId: string, messages: ChatItem[]): Promise<Chat> => {
  try {
    const response = await fetch(`${API_URL}/api/chats/${chatId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });
    if (!response.ok) {
      throw new APIError('Failed to update chat', response.status);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError('An unexpected error occurred');
  }
};

export const deleteChat = async (chatId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/api/chats/${chatId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new APIError('Failed to delete chat', response.status);
    }
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError('An unexpected error occurred');
  }
};

// Research related API calls
export const fetchResearch = async (query: string, urls?: string[]): Promise<ResearchData[]> => {
  try {
    const response = await fetch(`${API_URL}/api/research`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        urls: urls || [],
        options: {
          use_ai_summary: true,
          content_max_length: 10000,
          urls_per_query: 3
        }
      }),
    });

    if (!response.ok) {
      throw new APIError('Failed to fetch research data', response.status);
    }

    const data = await response.json();
    
    return data.results.map((result: any) => ({
      url: result.url,
      title: result.title,
      content: result.content,
      timestamp: result.timestamp,
      status: result.status,
      summary: {
        summary: result.summary.main_summary || '',
        key_points: result.summary.key_points || [],
        market_impact: result.summary.market_impact || {
          short_term: '',
          medium_term: '',
          long_term: ''
        },
        trading_implications: result.summary.trading_implications || {
          entry_points: [],
          exit_targets: [],
          stop_loss_levels: [],
          position_sizing: ''
        },
        technical_analysis: result.summary.technical_analysis || {
          trend_direction: '',
          support_levels: [],
          resistance_levels: [],
          indicators: {
            rsi: '',
            macd: '',
            moving_averages: ''
          },
          patterns: []
        },
        sentiment_analysis: result.summary.sentiment_analysis || {
          overall_sentiment: '',
          sentiment_score: '',
          social_metrics: {
            social_volume: '',
            sentiment_trend: ''
          },
          market_confidence: ''
        },
        risk_assessment: result.summary.risk_assessment || {
          risk_level: '',
          risk_factors: [],
          mitigation_strategies: [],
          risk_reward_ratio: ''
        },
        price_analysis: result.summary.price_analysis || {
          current_price: '',
          target_prices: {
            short_term: [],
            medium_term: [],
            long_term: []
          },
          price_drivers: [],
          volatility_assessment: ''
        }
      },
      agent_id: result.agent_id,
      extraction_method: result.extraction_method
    }));
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError('An unexpected error occurred');
  }
};

// System messages related API calls
export const fetchSystemMessages = async (): Promise<SystemMessage[]> => {
  try {
    const response = await fetch(`${API_URL}/api/system/messages`);
    if (!response.ok) {
      throw new APIError('Failed to fetch system messages', response.status);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError('An unexpected error occurred');
  }
};

export const updateSystemMessage = async (messageId: string, content: string): Promise<SystemMessage> => {
  try {
    const response = await fetch(`${API_URL}/api/system/messages/${messageId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) {
      throw new APIError('Failed to update system message', response.status);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError('An unexpected error occurred');
  }
};

// Custom tools related API calls
export const fetchCustomTools = async (): Promise<CustomTool[]> => {
  try {
    const response = await fetch(`${API_URL}/api/tools/custom`);
    if (!response.ok) {
      throw new APIError('Failed to fetch custom tools', response.status);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError('An unexpected error occurred');
  }
};

export const createCustomTool = async (tool: Omit<CustomTool, 'id'>): Promise<CustomTool> => {
  try {
    const response = await fetch(`${API_URL}/api/tools/custom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tool),
    });
    if (!response.ok) {
      throw new APIError('Failed to create custom tool', response.status);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError('An unexpected error occurred');
  }
};

export const updateCustomTool = async (toolId: string, updates: Partial<CustomTool>): Promise<CustomTool> => {
  try {
    const response = await fetch(`${API_URL}/api/tools/custom/${toolId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new APIError('Failed to update custom tool', response.status);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError('An unexpected error occurred');
  }
};

export const deleteCustomTool = async (toolId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/api/tools/custom/${toolId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new APIError('Failed to delete custom tool', response.status);
    }
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError('An unexpected error occurred');
  }
};