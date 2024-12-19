import './index.css';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { Chat, ChatState, Tool, ToolCreate, SystemPrompt, ActivityState, MessageRole } from './types';
import ChatList from './components/ChatList';
import { RightPanel } from './components/RightPanel';
import { CentralWindow } from './components/CentralWindow';
import { chatApi } from './api/chat'; 
import { ErrorDisplay } from './components/ErrorDisplay';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  // All chats that exist
  const [chats, setChats] = useState<Chat[]>([]);
  // Only the chats that are open in tabs
  const [openChats, setOpenChats] = useState<Record<string, ChatState>>({});
  // Cache of chat states
  const [chatStateCache, setChatStateCache] = useState<Record<string, ChatState>>({});
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [tabOrder, setTabOrder] = useState<number[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loadingTools, setLoadingTools] = useState(false);
  const [activeTool, setActiveTool] = useState<number | null>(null);
  const [isTmuxMode, setIsTmuxMode] = useState(false);
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompt[]>([]);
  const [loadingSystemPrompts, setLoadingSystemPrompts] = useState(false);
  const [activeSystemPrompt, setActiveSystemPrompt] = useState<number | null>(null);
  
  const [activityState, setActivityState] = useState<ActivityState>({
    global: {
      messages: {
        [MessageRole.USER]: 0,
        [MessageRole.ASSISTANT]: 0,
        [MessageRole.SYSTEM]: 0,
        [MessageRole.TOOL]: 0
      },
      llmConfigChanges: 0,
      total: 0
    },
    threadSpecific: {}
  });

  // Function to increment activity counters
  const incrementActivityCounters = useCallback((chatId: number, type: 'message' | 'llmConfig', messageRole?: MessageRole) => {
    setActivityState(prev => {
      // Create new thread state if it doesn't exist
      const threadState = prev.threadSpecific[chatId] || {
        messages: {
          [MessageRole.user]: 0,
          [MessageRole.assistant]: 0,
          [MessageRole.system]: 0,
          [MessageRole.tool]: 0
        },
        llmConfigChanges: 0
      };

      // Create new state with deep copies
      const newState = {
        global: {
          messages: { ...prev.global.messages },
          llmConfigChanges: prev.global.llmConfigChanges,
          total: prev.global.total
        },
        threadSpecific: {
          ...prev.threadSpecific,
          [chatId]: {
            messages: { ...threadState.messages },
            llmConfigChanges: threadState.llmConfigChanges
          }
        }
      };

      // Update counters based on type
      if (type === 'message' && messageRole) {
        newState.global.messages[messageRole]++;
        newState.threadSpecific[chatId].messages[messageRole]++;
      } else if (type === 'llmConfig') {
        newState.global.llmConfigChanges++;
        newState.threadSpecific[chatId].llmConfigChanges++;
      }

      // Update total
      newState.global.total++;

      console.log('Activity tracking - State update:', {
        old: prev.global.messages,
        new: newState.global.messages
      });

      return newState;
    });
  }, []);

  // Generate chat title from first message
  const generateChatTitle = useCallback((chat: Chat): string => {
    const firstUserMessage = chat.history.find(message => message.role === 'user');
    if (!firstUserMessage) return `Chat ${chat.id}`;
    return firstUserMessage.content.slice(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '');
  }, []);

  // Open a chat in a new tab
  const openChatTab = useCallback(async (chat: Chat) => {
    console.log('Opening chat tab:', chat);
    const tabId = chat.id.toString();
    
    try {
      // Check if chat is already open
      if (openChats[tabId]) {
        setActiveTabId(tabId);
        return;
      }

      // Get fresh data from API
      const freshChat = await chatApi.getChat(chat.id);
      
      // Use cached state if available, otherwise create new state
      const cachedState = chatStateCache[tabId];
      const newState: ChatState = cachedState || {
        chat: freshChat,
        messages: freshChat.history || [],
        error: undefined,
        isLoading: false,
        previewMessage: undefined
      };

      // Update both open chats and cache
      setOpenChats(prev => ({
        ...prev,
        [tabId]: newState
      }));

      setChatStateCache(prev => ({
        ...prev,
        [tabId]: newState
      }));

      // Add to tabOrder if not already there
      setTabOrder(prev => {
        if (!prev.includes(chat.id)) {
          console.log('Adding chat to tab order:', chat.id);
          return [...prev, chat.id];
        }
        return prev;
      });
      
      console.log('Setting active tab ID:', tabId);
      setActiveTabId(tabId);
    } catch (error) {
      console.error('Failed to open chat:', error);
      setError(error instanceof Error ? error.message : 'Failed to open chat');
    }
  }, [openChats, chatStateCache]);

  // Set default name for a chat if it doesn't have one
  const ensureChatHasName = async (chat: Chat) => {
    if (!chat.name) {
      try {
        return await chatApi.updateChatName(chat.id, `Chat ${chat.id}`);
      } catch (err) {
        console.error(`Failed to set default name for chat ${chat.id}:`, err);
        return chat;
      }
    }
    return chat;
  };

  // Load existing chats
  const loadChats = useCallback(async () => {
    try {
      const loadedChats = await chatApi.listChats();
      
      // Only set names on first load
      if (chats.length === 0) {
        const updatedChats = await Promise.all(loadedChats.map(ensureChatHasName));
        setChats(updatedChats);
      } else {
        setChats(loadedChats);
      }

      // For any already open chats, update their data
      const updatedOpenChats = { ...openChats };
      let hasChanges = false;
      
      for (const tabId of Object.keys(openChats)) {
        try {
          const freshChat = await chatApi.getChat(parseInt(tabId, 10));
          // Only update if there are actual changes
          if (JSON.stringify(freshChat) !== JSON.stringify(openChats[tabId].chat)) {
            updatedOpenChats[tabId] = {
              ...updatedOpenChats[tabId],
              chat: freshChat,
              messages: freshChat.history || []
            };
            hasChanges = true;
          }
        } catch (err) {
          console.error(`Failed to refresh chat ${tabId}:`, err);
        }
      }
      
      // Only update openChats if there were actual changes
      if (hasChanges) {
        setOpenChats(updatedOpenChats);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
      setError(error instanceof Error ? error.message : 'Failed to load chats');
    }
  }, []); // Remove dependencies since this is a refresh function

  // Initial load
  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // Update tab order when chats change
  useEffect(() => {
    setTabOrder(prev => {
      const openChatIds = Object.keys(openChats).map(id => parseInt(id, 10));
      // Keep existing order for open tabs
      const existingOrder = prev.filter(id => openChatIds.includes(id));
      // Add newly opened tabs to the end
      const newTabs = openChatIds.filter(id => !prev.includes(id));
      return [...existingOrder, ...newTabs];
    });
  }, [openChats]);

  // Close a tab (but don't delete the chat)
  const handleTabClose = useCallback((tabId: string) => {
    // Save current state to cache before closing
    const currentState = openChats[tabId];
    if (currentState) {
      setChatStateCache(prev => ({
        ...prev,
        [tabId]: currentState
      }));
    }

    // Remove from openChats
    const { [tabId]: removedChat, ...remainingChats } = openChats;
    setOpenChats(remainingChats);

    // Update active tab if needed
    if (activeTabId === tabId) {
      const remainingTabs = Object.keys(remainingChats);
      setActiveTabId(remainingTabs.length > 0 ? remainingTabs[0] : null);
    }

    // Remove from tab order
    setTabOrder(prev => prev.filter(id => id !== parseInt(tabId, 10)));
  }, [activeTabId, openChats]);

  // Delete a chat entirely
  const handleDeleteChat = useCallback(async (chatId: number) => {
    try {
      await chatApi.deleteChat(chatId);
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      
      // Close its tab if it's open
      const tabId = chatId.toString();
      if (openChats[tabId]) {
        handleTabClose(tabId);
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete chat');
    }
  }, [openChats, handleTabClose]);

  const loadTools = useCallback(async () => {
    try {
      setLoadingTools(true);
      const loadedTools = await chatApi.listTools();
      setTools(loadedTools);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tools');
    } finally {
      setLoadingTools(false);
    }
  }, []);

  const loadSystemPrompts = useCallback(async () => {
    try {
      setLoadingSystemPrompts(true);
      const loadedPrompts = await chatApi.listSystemPrompts();
      // Sort prompts by ID to maintain consistent order, just like tools
      const sortedPrompts = [...loadedPrompts].sort((a, b) => {
        if (a.id === undefined || b.id === undefined) return 0;
        return a.id - b.id;
      });
      setSystemPrompts(sortedPrompts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load system prompts');
    } finally {
      setLoadingSystemPrompts(false);
    }
  }, []);

  // Load tools and system prompts on mount
  useEffect(() => {
    loadTools();
    loadSystemPrompts();
  }, []);

  const createNewChat = useCallback(async () => {
    try {
      let newChat = await chatApi.createChat();
      // Ensure the new chat has a name
      newChat = await ensureChatHasName(newChat);
      
      setChats(prevChats => [...prevChats, newChat]);
      await openChatTab(newChat);

      // If there's a system prompt assigned to the chat, update the state
      if (newChat.system_prompt_id) {
        const promptId = typeof newChat.system_prompt_id === 'string'
          ? parseInt(newChat.system_prompt_id, 10)
          : newChat.system_prompt_id;
        setActiveSystemPrompt(promptId);
      } else if (newChat.system_prompt?.id) {
        // Backward compatibility
        setActiveSystemPrompt(newChat.system_prompt.id);
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
      setError(error instanceof Error ? error.message : 'Failed to create chat');
    }
  }, [openChatTab]);

  const handleAssignTool = useCallback(async (toolId: number) => {
    if (!activeTabId) return;
    const chatId = openChats[activeTabId].chat.id;
    
    try {
      const tool = tools.find(t => t.id === toolId);
      if (!tool) throw new Error('Tool not found');
      
      const updatedChat = await chatApi.assignToolToChat(chatId, toolId, tool.is_callable);
      
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? updatedChat : chat
      ));
      
      setOpenChats(prev => ({
        ...prev,
        [activeTabId]: {
          ...prev[activeTabId],
          chat: updatedChat
        }
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign tool');
    }
  }, [activeTabId, openChats, tools]);

  const handleDeleteTool = useCallback(async (toolId: number) => {
    try {
      setLoadingTools(true);
      const tool = tools.find(t => t.id === toolId);
      if (!tool) throw new Error('Tool not found');
      
      await chatApi.deleteTool(toolId, tool.is_callable);
      setTools(prevTools => prevTools.filter(t => t.id !== toolId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tool');
    } finally {
      setLoadingTools(false);
    }
  }, [tools]);

  const handleAssignSystemPrompt = useCallback(async (promptId: number) => {
    if (!activeTabId) return;
    const chatId = parseInt(activeTabId, 10);
    
    try {
      setError('');
      const updatedChat = await chatApi.assignSystemPromptToChat(chatId, promptId);
      
      // Update global chat list
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? updatedChat : chat
      ));
      
      // Update open chat if it exists
      const tabId = chatId.toString();
      if (openChats[tabId]) {
        setOpenChats(prev => ({
          ...prev,
          [tabId]: {
            ...prev[tabId],
            chat: updatedChat,
            messages: updatedChat.history || []
          }
        }));
      }
      
      // Update active system prompt immediately
      setActiveSystemPrompt(promptId);
    } catch (error) {
      console.error('Failed to assign system prompt:', error);
      const message = error instanceof Error ? error.message : 'Failed to assign system prompt';
      setError(message);
      // Reset active system prompt on error
      if (openChats[activeTabId]) {
        const currentPromptId = openChats[activeTabId].chat.system_prompt_id;
        setActiveSystemPrompt(currentPromptId ? 
          typeof currentPromptId === 'string' ? parseInt(currentPromptId, 10) : currentPromptId 
          : null
        );
      }
    }
  }, [activeTabId, openChats]);

  const handleDeleteSystemPrompt = useCallback(async (promptId: number) => {
    try {
      await chatApi.deleteSystemPrompt(promptId);
      await loadSystemPrompts();
    } catch (error) {
      console.error('Failed to delete system prompt:', error);
    }
  }, [loadSystemPrompts]);

  const sendMessageAsync = useCallback(async (content: string, triggerAssistant: boolean = false) => {
    if (!activeTabId) return;
    const chatState = openChats[activeTabId];
    if (!chatState) return;

    const chatId = parseInt(activeTabId, 10);
    const updateState = (newState: Partial<ChatState>) => {
      const updatedState = {
        ...chatState,
        ...newState
      };

      // Update both openChats and cache
      setOpenChats(prev => ({
        ...prev,
        [activeTabId]: updatedState
      }));

      setChatStateCache(prev => ({
        ...prev,
        [activeTabId]: updatedState
      }));
    };

    // Set loading state
    updateState({
      isLoading: true,
      previewMessage: triggerAssistant ? undefined : content,
      error: undefined,
    });

    try {
      // Use triggerAssistantResponse when triggered by Ctrl+Enter/button, otherwise use sendMessage
      const updatedChat = triggerAssistant 
        ? await chatApi.triggerAssistantResponse(chatId)
        : await chatApi.sendMessage(chatId, content);

      // Get the new messages by comparing lengths
      const oldMessages = chatState.messages || [];
      const newMessages = updatedChat.history || [];
      
      console.log('Activity tracking - Old messages:', oldMessages.length, 'New messages:', newMessages.length);
      
      // Find new messages and increment counters for each
      const newMsgs = newMessages.slice(oldMessages.length);
      console.log('Activity tracking - New messages to process:', newMsgs);
      
      newMsgs.forEach(msg => {
        console.log('Activity tracking - Incrementing counter for role:', msg.role);
        incrementActivityCounters(chatId, 'message', msg.role);
      });

      // Update state with new messages
      updateState({
        chat: updatedChat,
        messages: newMessages,
        isLoading: false,
        previewMessage: undefined,
        error: undefined
      });
      
    } catch (error) {
      console.error('Failed to send message:', error);
      updateState({
        error: error instanceof Error ? error.message : 'Failed to send message',
        isLoading: false,
        previewMessage: undefined,
      });
    }
  }, [activeTabId, openChats, incrementActivityCounters]);

  const handleCreateTool = async (tool: ToolCreate) => {
    try {
      setLoadingTools(true);
      const newTool = await chatApi.createTool(tool);
      setTools(prevTools => [...prevTools, newTool]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tool');
    } finally {
      setLoadingTools(false);
    }
  };

  const handleUpdateTool = async (toolId: number, tool: Partial<ToolCreate>) => {
    try {
      setLoadingTools(true);
      const updatedTool = await chatApi.updateTool(toolId, tool);
      setTools(prevTools => prevTools.map(t => (t.id === toolId ? updatedTool : t)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tool');
    } finally {
      setLoadingTools(false);
    }
  };

  const handleClearHistory = useCallback(async (chatId: number) => {
    try {
      const updatedChat = await chatApi.clearHistory(chatId);
      const tabId = chatId.toString();
      
      // Update open chats state
      setOpenChats(prev => ({
        ...prev,
        [tabId]: {
          ...prev[tabId],
          chat: updatedChat,
          messages: [], // Immediately clear messages
        }
      }));

      // Update global chat list
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? updatedChat : chat
      ));
    } catch (error) {
      console.error('Failed to clear history:', error);
      setError(error instanceof Error ? error.message : 'Failed to clear history');
    }
  }, []);

  const handleTabReorder = useCallback((fromIndex: number, toIndex: number) => {
    setTabOrder(prev => {
      const newOrder = [...prev];
      // Simple swap of elements
      [newOrder[fromIndex], newOrder[toIndex]] = [newOrder[toIndex], newOrder[fromIndex]];
      return newOrder;
    });
  }, []);

  const handleUpdateAutoTools = useCallback(async (chatId: number, toolIds: number[]) => {
    try {
      const updatedChat = await chatApi.updateChatAutoTools(chatId, toolIds);
      
      // Update global chat list
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? updatedChat : chat
      ));
      
      // Update open chat if it exists
      const tabId = chatId.toString();
      if (openChats[tabId]) {
        setOpenChats(prev => ({
          ...prev,
          [tabId]: {
            ...prev[tabId],
            chat: updatedChat,
            messages: updatedChat.history || []
          }
        }));
      }
    } catch (error) {
      console.error('Failed to update auto tools:', error);
      setError(error instanceof Error ? error.message : 'Failed to update auto tools');
    }
  }, [openChats]);

  // Get sorted chats based on tab order (only for open tabs)
  const sortedOpenChats = useMemo(() => {
    const chatMap = new Map(chats.map(chat => [chat.id, chat]));
    return tabOrder
      .map(id => chatMap.get(id))
      .filter((chat): chat is Chat => chat !== undefined && chat.id.toString() in openChats);
  }, [chats, tabOrder, openChats]);

  const activeChat = useMemo(() => {
    if (!activeTabId) return null;
    return openChats[activeTabId]?.chat;
  }, [activeTabId, openChats]);

  // Update active tool and system prompt when chat changes
  useEffect(() => {
    if (!activeTabId) {
      setActiveTool(null);
      setActiveSystemPrompt(null);
      return;
    }
    const chatState = openChats[activeTabId];
    if (!chatState) return;

    // Update active tool
    if (chatState.chat.active_tool_id) {
      const toolId = typeof chatState.chat.active_tool_id === 'string' 
        ? parseInt(chatState.chat.active_tool_id, 10)
        : chatState.chat.active_tool_id;
      setActiveTool(toolId);
    } else {
      setActiveTool(null);
    }

    // Update active system prompt
    if (chatState.chat.system_prompt_id) {
      const promptId = typeof chatState.chat.system_prompt_id === 'string'
        ? parseInt(chatState.chat.system_prompt_id, 10)
        : chatState.chat.system_prompt_id;
      setActiveSystemPrompt(promptId);
    } else if (chatState.chat.system_prompt?.id) {
      // Backward compatibility
      setActiveSystemPrompt(chatState.chat.system_prompt.id);
    } else {
      setActiveSystemPrompt(null);
    }
  }, [activeTabId, openChats]);

  // Helper function to get tool name
  const getToolName = (tool: Tool | undefined): string | undefined => {
    if (!tool) return undefined;
    if (tool.is_callable) {
      return tool.name;
    }
    return tool.schema_name;
  };

  const handleChatsUpdate = useCallback((updatedChats: Record<string, ChatState>) => {
    setOpenChats(updatedChats);
    // Also update the cache
    setChatStateCache(prev => ({
      ...prev,
      ...updatedChats
    }));
  }, []);

  return (
    <ThemeProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Left Sidebar */}
        <ChatList
          chats={chats}
          onSelectChat={openChatTab}
          selectedChatId={activeTabId ? parseInt(activeTabId, 10) : null}
          onCreateChat={createNewChat}
          onDeleteChat={handleDeleteChat}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <CentralWindow
            openChats={openChats}
            tabOrder={tabOrder}
            activeTabId={activeTabId}
            isTmuxMode={isTmuxMode}
            onSendMessage={sendMessageAsync}
            onTabSelect={setActiveTabId}
            onTabClose={handleTabClose}
            onAfterDelete={handleTabClose}
            onAfterClear={handleClearHistory}
            tools={tools}
            systemPrompts={systemPrompts}
            activeTool={activeTool}
            activeSystemPrompt={activeSystemPrompt}
            onTmuxModeToggle={() => setIsTmuxMode(!isTmuxMode)}
            onLLMConfigUpdate={(chatId: number) => incrementActivityCounters(chatId, 'llmConfig')}
            onTabReorder={handleTabReorder}
            onChatsUpdate={handleChatsUpdate}
          />
        </div>

        {/* Right Panel */}
        <RightPanel
          activeChatId={activeTabId ? parseInt(activeTabId, 10) : null}
          tools={tools}
          systemPrompts={systemPrompts}
          onCreateTool={handleCreateTool}
          onAssignTool={handleAssignTool}
          onDeleteTool={handleDeleteTool}
          onUpdateTool={handleUpdateTool}
          onRefreshTools={loadTools}
          onAssignSystemPrompt={handleAssignSystemPrompt}
          onDeleteSystemPrompt={handleDeleteSystemPrompt}
          onRefreshSystemPrompts={loadSystemPrompts}
          loading={loadingTools || loadingSystemPrompts}
          activeTool={activeTool}
          activeSystemPrompt={activeSystemPrompt}
          chatState={activeTabId ? openChats[activeTabId] : undefined}
          activityState={activityState}
          onUpdateAutoTools={handleUpdateAutoTools}
        />

        {/* Global Error Display */}
        {error && <ErrorDisplay error={error} onDismiss={() => setError(undefined)} />}
      </div>
    </ThemeProvider>
  );
}

export default App;
