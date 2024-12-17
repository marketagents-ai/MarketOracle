import { API_BASE_URL } from '../index';
export { chatApi } from './chat';
import { Message, MessageRole, ResponseFormat } from '../types';
export { toolsApi } from './tools';
export { researchApi } from './research';

// Export types from types file
export type { 
    MessageRole,
    Chat,
    ChatState,
    Tool,
    ToolCreate,
    SystemPrompt,
    SystemPromptCreate,
    LLMConfig,
    LLMConfigUpdate,
    // Remove duplicate ResponseFormat export
} from '../types';

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

export const chatApi = {
  getChats: async (): Promise<Chat[]> => {
      const response = await axios.get(`${API_BASE_URL}/chats/`);
      return response.data as Chat[];
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

export interface Message {
  id: number;
  chat_id: number;
  role: MessageRole;
  content: string;
  created_at: string;
}

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
  TOOL = 'tool'
}


export type ResponseFormat = 'text' | 'json' | 'json_object' | 'tool' | 'function_call' | 'auto_tools';


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
  summary: Summary;
  analysis: Analysis;
  timestamp: string;
}

// Message Types
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

export interface ChatState {
    chat: Chat;
    messages: Message[];
    error?: string;
    isLoading: boolean;
    previewMessage?: string;
}

// Tool Related Types
export interface Tool {
    id: number;
    name: string;
    description: string;
    schema: any;
    is_enabled?: boolean;
    is_callable?: boolean;
    created_at?: string;
}

export interface ToolCreate {
    name: string;
    description: string;
    schema: any;
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
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  response_format: ResponseFormat;
  client: string;
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
  tabs: {
    id: string;
    name?: string;
    chatId: number;
    systemPromptName?: string;
    toolName?: string;
  }[];
  activeTabId: string | null;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTmuxModeToggle: () => void;
  isTmuxMode: boolean;
  tabOrder: number[];
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