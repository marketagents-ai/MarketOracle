import { 
  Chat, 
  Message, 
  LLMConfig, 
  ResearchResult, 
  MessageRole,
  // ... other types you need
} from '../types';

import { ResponseFormat } from './responseTypes';
import { API_BASE_URL } from './config';
import axios from 'axios';
// import { MessageRole } from '../types';

export { chatApi } from './chat';
export { toolsApi } from './tools';
export { researchApi } from './research';

// Export types from types file
export type { 
  MessageRole,
  Chat,
  Message,
  LLMConfig,
  ResearchResult,
  ResponseFormat
};

// Re-export MessageRole from types
export { MessageRole };


export interface ValidationErrors {
    [key: string]: string[];
}


export interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

export interface Chat {
  id: number;
  created_at: string;
  title?: string;
  messages: Message[];
  config?: LLMConfig;
}

const chatapi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// export const chatapi = axios.create({
//   baseURL: API_BASE_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });



//   getHistory: async (): Promise<ResearchResult[]> => {
//     const response = await chatapi.get('/research/history');
//     return response.data;
//   }
// };

// // Remove duplicate declarations
// export type ResponseFormat = 'text' | 'json' | 'function_call' | 'json_object';


export interface Message {
  id: number;
  chat_id: number;
  role: MessageRole;

  content: string;
  created_at: string;
}

// export enum MessageRole {
//   USER = 'user',
//   ASSISTANT = 'assistant',
//   SYSTEM = 'system',
//   TOOL = 'tool'
// }

export interface Tab {
  id: string;
  title: string;
}





export interface Summary {
  summary: string;
  sentiment?: string;
  key_points?: string[];
}

export interface Analysis {
  market_sentiment?: string;
  key_trends?: string[];
}

export interface ResearchResult {
  query: string;
  timestamp: string;
  results: WebSearchResult[];
}

export interface ResearchRequest {
  query: string;
  parameters?: Record<string, any>;
}


export interface WebSearchResult {
  url: string;
  title: string;
  content: string;
  timestamp?: string;
  status?: string;
  summary?: {
    summary?: string;
    sentiment?: string;
    key_points?: string[];
  };
}

export interface Message {
  role: MessageRole;
  content: string | { type: string; data: any };
  timestamp?: string;
}


export interface Chat {
  id: number;
  created_at: string;
  title?: string;
  messages: Message[];
  config?: LLMConfig;
}

export interface Chat {
  id: number;
  name?: string;
  history: Message[];
  active_tool_id?: number;
  stop_tool_id?: number;
  system_prompt_id?: number;
}

export interface Tool {
  id: number;
  name: string;
  description: string;
  schema_name: string;
  input_schema: Record<string, any>;
  output_schema: Record<string, any>;
  is_callable?: boolean;
}


export interface ToolCreate {
  name: string;
  description: string;
  schema_name: string;
  input_schema: Record<string, any>;
  output_schema: Record<string, any>;
  is_callable?: boolean;
}

// System Prompt Types
export interface SystemPrompt {
    id: number;
    name: string;
    content: string;
    created_at?: string;
}

export interface SystemPromptCreate {
    name: string;
    content: string;
}


export interface LLMConfig {
  client: string;
  model: string;
  temperature?: number;
  max_tokens?: number;
  response_format?: ResponseFormat;
  system_prompt?: string;
}

export interface ChatState {
  chat: Chat;
  messages: Message[];
  error?: Error;
  isLoading: boolean;
  previewMessage?: string;
}


export interface LLMConfigUpdate {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  response_format?: ResponseFormat;
  client?: string;
}

// Component Props Types
export interface ChatInputProps {
    onSendMessage: (message: string) => void;
    onTriggerAssistant?: () => void;
    disabled?: boolean;
    autoFocus?: boolean;
}

export interface ChatControlBarProps {
  chatId: number;
  config: LLMConfig;
  onConfigUpdate: (update: LLMConfigUpdate) => void;
}

export interface ChatListProps {
    chats: Chat[];
    onSelectChat: (chatId: number) => void;
    selectedChatId: number | null;
    onCreateChat?: () => void;
    onDeleteChat?: (chatId: number) => void;
}

export interface RightPanelProps {
    activeChatId: number | null;
    tools: Tool[];
    systemPrompts: SystemPrompt[];
    onCreateTool: (tool: ToolCreate) => Promise<void>;
    onAssignTool: (chatId: number, toolId: number) => Promise<void>;
    onDeleteTool: (toolId: number) => Promise<void>;
    onUpdateTool: (toolId: number, tool: Partial<ToolCreate>) => Promise<void>;
    onRefreshTools: () => Promise<void>;
    onAssignSystemPrompt: (chatId: number, promptId: number) => Promise<void>;
    onRefreshSystemPrompts: () => Promise<void>;
    onDeleteSystemPrompt: (promptId: number) => Promise<void>;
    loading: boolean;
    activeTool?: number | null;
    activeSystemPrompt?: number | null;
}

export interface TmuxLayoutProps {
  openChats: Record<string, ChatState>;
  tabOrder: number[];
  activeTabId: string | null;
  onSendMessage: (message: string) => Promise<void>;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onAfterDelete: () => void;
  onAfterClear: () => void;
  tools: Tool[];
  systemPrompts: SystemPrompt[];
}

export interface TypedTool extends Tool {
  type: 'typed';
  input_schema: Record<string, any>;
  output_schema: Record<string, any>;
}

export interface CallableTool extends Tool {
  type: 'callable';
  function_name: string;
  parameters: Record<string, any>;
}

export interface TypedToolCreate extends ToolCreate {
  type: 'typed';
  input_schema: Record<string, any>;
  output_schema: Record<string, any>;
}

export interface CallableToolCreate extends ToolCreate {
  type: 'callable';
  function_name: string;
  parameters: Record<string, any>;
}
export interface ChatWindowProps {
  messages: Message[];
  onSendMessage?: (message: string) => Promise<void>;
  error?: string | null;
  isLoading?: boolean;
  previewMessage?: string;
  isActive?: boolean;
  researchResults?: ResearchResult;
}



export interface TabBarProps {
  tabs: Tab[];
  activeTabId: string | null;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTmuxModeToggle: () => void;
  isTmuxMode: boolean;
}

export interface ErrorDisplayProps {
    error: Error | string | null;
    onDismiss: () => void;
}

export interface UserPreviewMessageProps {
    content: string;
}

export interface DataViewerProps {
    data: any;
    tool_name?: string;
}

export interface DataNodeProps extends DataViewerProps {
    path?: string;
    depth?: number;
}

export interface ValidationErrors {
  [key: string]: string[];
}

export interface SystemPanelProps {
  systemPrompts: SystemPrompt[];
  onRefreshSystemPrompts: () => Promise<void>;
}
export type Theme = 'light' | 'dark';

export interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}
export interface DataViewerProps {
  data: any;
  tool_name?: string;
}

export interface DataNodeProps {
  data: any;
  path?: string;
  depth?: number;
  tool_name?: string;
}