import React, { useState } from 'react';
import { ChatInput } from './components/ChatInput/ChatInput';
import { ChatHistory } from './components/ChatHistory';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Header } from './components/Header/Header';
import { ToolsPanel } from './components/ToolsPanel/ToolsPanel';
import { ChatModeSelector } from './components/ChatModes/ChatModeSelector';
import { useChats } from './hooks/useChats';
import { fetchResearch } from './services/api';
import { handleAPIError } from './utils/api';
import type { ChatItem, ChatMode } from './types/chat';

export const App: React.FC = () => {
  const { chats, activeChat, setActiveChat, createChat, updateChat, updateChatMode } = useChats();
  const [isLoading, setIsLoading] = useState(false);

  const activeMessages = chats.find(chat => chat.id === activeChat)?.messages || [];
  const activeChatMode = chats.find(chat => chat.id === activeChat)?.mode || 'research';

  const handleSubmit = async (query: string, urls?: string[]) => {
    if (!activeChat) {
      const newChatId = createChat(activeChatMode);
      if (!newChatId) return;
    }

    const chatId = activeChat || chats[0].id;
    const userMessage: ChatItem = {
      isUser: true,
      content: query,
      timestamp: new Date(),
      mode: activeChatMode
    };
    
    const newMessages = [...activeMessages, userMessage];
    updateChat(chatId, newMessages);
    
    setIsLoading(true);
    try {
      const data = await fetchResearch(query, urls);
      const responseMessage: ChatItem = {
        isUser: false,
        content: data,
        timestamp: new Date(),
        mode: activeChatMode
      };
      updateChat(chatId, [...newMessages, responseMessage]);
    } catch (error) {
      const errorMessage: ChatItem = {
        isUser: false,
        content: handleAPIError(error),
        timestamp: new Date(),
        mode: activeChatMode
      };
      updateChat(chatId, [...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = (mode: ChatMode) => {
    if (activeChat) {
      updateChatMode(activeChat, mode);
    } else {
      createChat(mode);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <Sidebar
        chats={chats}
        activeChat={activeChat}
        onNewChat={() => createChat(activeChatMode)}
        onSelectChat={setActiveChat}
      />
      
      <div className="flex-1 flex flex-col">
        <Header />
        <div className="p-4">
          <ChatModeSelector
            mode={activeChatMode}
            onModeChange={handleModeChange}
          />
        </div>
        <ChatHistory messages={activeMessages} />
        <ChatInput 
          mode={activeChatMode}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          disabled={false}
        />
      </div>

      <ToolsPanel />
    </div>
  );
};