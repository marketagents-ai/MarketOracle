import { MessageRole } from '../api';

export type Theme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

export interface UserPreviewMessageProps {
  content: string;
}

export type ResponseFormat = 'text' | 'json_object';

export interface ResearchResult {
  query: string;
  summaries: Summary[];
  analysis: Analysis;
}

export interface Summary {
  url: string;
  summary: string;
}

export interface Analysis {
  key_points: string[];
  recommendations: string[];
}


export type MessageRole = 'user' | 'assistant' | 'system' | 'tool' | 'function';

export interface Message {
  role: MessageRole;
  content: string | any;
  timestamp?: string;
  metadata?: any;
}

export interface ChatState {
  id: number;
  messages: Message[];
  error?: string;
  isLoading: boolean;
  previewMessage?: string;
  config?: LLMConfig;
  systemPromptId?: number;
  systemPrompt?: SystemPrompt;
}

export interface LLMConfig {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  response_format?: ResponseFormat;
}

export type ResponseFormat = 'text' | 'json' | 'function_call';
export interface Tool {
    id: number;
    schema_name: string;
    schema_description: string;
    instruction_string: string;
    json_schema: any;
    strict_schema: boolean;
    is_callable?: boolean;
    name?: string;
    description?: string;
    input_schema?: any;
    output_schema?: any;
    created_at?: string;
  }

export interface ToolCreate {
schema_name: string;
schema_description: string;
instruction_string: string;
json_schema: any;
strict_schema: boolean;
}

export interface SystemPrompt {
  id: number;
  name: string;
  content: string;
  created_at: string;
}

export interface ActivityState {
  global: {
    messages: Record<MessageRole, number>;
    llmConfigChanges: number;
    total: number;
  };
  threadSpecific: {
    [key: number]: {
      messages: Record<MessageRole, number>;
      llmConfigChanges: number;
      total: number;
    };
  };
}

