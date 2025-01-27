import React from 'react';
import { Avatar } from './Avatar/Avatar';
import { ResearchResult } from './ChatMessage/ResearchResult';
import type { ResearchData } from '../types/research';

interface ChatMessageProps {
  isUser: boolean;
  content: any; // could be string or { results, metrics, schema }
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ isUser, content }) => {
// ChatMessage.tsx (simplified example)
  if (content && typeof content === 'object' && 'results' in content) {
    // content.results is the actual array
    const results = content.results as ResearchData[];
    const schema = content.schema || null;
    const metrics = content.metrics || null;

    return (
      <div className="flex gap-3">
        <Avatar isUser={isUser} />
        <div className="flex-1">
          <ResearchResult data={results} schema={schema} metrics={metrics} />
        </div>
      </div>
    );
  }

  // Handle normal text messages
  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <Avatar isUser={isUser} />
      <div
        className={`p-3 rounded-lg max-w-[80%] ${
          isUser ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'
        }`}
      >
        {typeof content === 'string' ? content : JSON.stringify(content)}
      </div>
    </div>
  );
};