import React, { useRef, useState, useEffect } from 'react';
import { Send, Search, Minimize2, Maximize2, CornerDownLeft } from 'lucide-react';
import { ChatInputProps } from '../types';
import { researchApi } from '../api';

const DEFAULT_HEIGHT = 44;

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  onTriggerAssistant,
  isLoading = false,
  placeholder = 'Type a message...',
}) => {
  const [message, setMessage] = useState('');
  const [isResearchMode, setIsResearchMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    if (isResearchMode) {
      try {
        const result = await researchApi.search(message);
        // Handle the research results - you might want to pass this up to a parent component
        onSendMessage(`Research Query: ${message}`, result);
      } catch (error) {
        console.error('Research error:', error);
      }
    } else {
      onSendMessage(message);
    }
    
    setMessage('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 p-2 border-t">
      <div className="flex-1 relative">
        <button
          type="button"
          onClick={() => setIsResearchMode(!isResearchMode)}
          className={`absolute left-2 top-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
            isResearchMode ? 'text-blue-500' : 'text-gray-500'
          }`}
          title={isResearchMode ? 'Switch to chat mode' : 'Switch to research mode'}
        >
          {isResearchMode ? <Search size={20} /> : <MessageSquare size={20} />}
        </button>
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isResearchMode ? 'Enter research query...' : placeholder}
          className="w-full p-2 pl-10 pr-10 rounded-md border resize-none dark:bg-gray-800 dark:border-gray-700"
          style={{ height: `${DEFAULT_HEIGHT}px` }}
          rows={1}
        />
      </div>
      <button
        type="submit"
        disabled={!message.trim() || isLoading}
        className="p-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        title={isResearchMode ? 'Start research' : 'Send message'}
      >
        {isResearchMode ? <Search className="h-5 w-4" /> : <Send className="h-5 w-4" />}
      </button>
    </form>
  );
};