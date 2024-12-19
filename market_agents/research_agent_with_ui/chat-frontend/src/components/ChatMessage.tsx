import React from 'react';


import { 
  MessageSquare, 
  User, 
  AlertTriangle,
  Wrench,
  Terminal,
  GanttChartSquare,
  Bot
} from 'lucide-react';
import DataViewer from './DataViewer';
import { MessageRole } from '../api/index.ts';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const getIcon = () => {
    switch (message.role) {
      case MessageRole.USER:
        return <User className="w-4 h-4 text-blue-500" />;
      case MessageRole.ASSISTANT:
        return <Bot className="w-4 h-4 text-green-500" />;
      case MessageRole.SYSTEM:
        return <Terminal className="w-4 h-4 text-purple-500" />;
      case MessageRole.TOOL:
        return <Wrench className="w-4 h-4 text-orange-500" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-500" />;
    }
  };

  const renderResearchContent = (content: any) => {
    return (
      <div className="research-result bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <GanttChartSquare className="w-5 h-5 text-blue-500" />
          <span className="font-medium text-gray-900 dark:text-gray-100">Research Results</span>
        </div>
        <DataViewer data={content} tool_name="Research" />
      </div>
    );
  };

  const renderError = (error: string) => {
    return (
      <div className="flex items-start gap-3 text-red-500">
        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-1" />
        <div>
          <div className="font-medium">Error</div>
          <div className="text-sm">{error}</div>
        </div>
      </div>
    );
  };

  return (
    <div className={`message flex gap-3 mb-4 ${message.role}`}>
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          {getIcon()}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
          {message.role.charAt(0).toUpperCase() + message.role.slice(1)}
        </div>
        <div className="prose dark:prose-invert max-w-none">
          {typeof message.content === 'object' && message.content.type === 'research' 
            ? renderResearchContent(message.content.data)
            : typeof message.content === 'string' && message.content.startsWith('Error:')
              ? renderError(message.content)
              : message.content}
        </div>
        {message.timestamp && (
          <div className="text-xs text-gray-500 mt-1">
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;