import React from 'react';
import { Avatar } from '../Avatar/Avatar';
import { ResearchResult } from './ResearchResult';
import type { ResearchData } from '../../types/research';

interface ChatMessageProps {
  isUser?: boolean;
  content: string | ResearchData[];
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ isUser = false, content }) => {
  const messageClass = isUser 
    ? 'ml-auto flex-row-reverse' 
    : 'flex-row';

  return (
    <div className={`flex items-start gap-3 mb-4 ${messageClass}`}>
      <Avatar isUser={isUser} />
      
      <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : 'text-left'}`}>
        {typeof content === 'string' ? (
          <div className={`rounded-lg p-3 inline-block ${
            isUser ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'
          }`}>
            <p>{content}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {content.map((result, index) => (
              <ResearchResult key={`${result.agent_id}-${index}`} data={result} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};