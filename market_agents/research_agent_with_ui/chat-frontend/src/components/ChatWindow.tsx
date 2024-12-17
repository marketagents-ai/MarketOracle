import React, { useRef, useEffect } from 'react';
import { Message, ResearchResult } from '../types';
import ChatMessage from './ChatMessage';
import { ResearchResults } from './ResearchResults';

interface ChatWindowProps {
  messages: Message[];
  loading?: boolean;
  researchResults?: ResearchResult;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, loading, researchResults }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex flex-col gap-4 p-4">
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}
        {researchResults && (
          <ResearchResults result={researchResults} />
        )}
        {loading && (
          <div className="flex gap-3 p-4 bg-gray-50">
            <div className="animate-pulse">Thinking...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};