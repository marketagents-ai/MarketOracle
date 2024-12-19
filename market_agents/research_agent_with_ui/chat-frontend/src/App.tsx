// src/App.tsx
import React, { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import ChatList from './components/ChatList';
import { CentralWindow } from './components/CentralWindow';
import { RightPanel } from './components/RightPanel';

function App() {
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);

  return (
    <ThemeProvider>
      <div className="flex h-screen bg-white dark:bg-gray-900">
        {/* Left Sidebar */}
        <div className="w-64 border-r border-gray-200 dark:border-gray-700">
          <ChatList 
            chats={chats}
            selectedChatId={selectedChatId}
            onSelectChat={setSelectedChatId}
            onCreateChat={handleCreateChat}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="h-full flex flex-col">
            {selectedChatId ? (
              <CentralWindow 
                openChats={openChats}
                tabOrder={[]}
                activeTabId={null}
                onSendMessage={handleSendMessage}
                onTabSelect={handleTabSelect}
                onTabClose={() => {}}
                tools={tools}
                systemPrompts={systemPrompts}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                Select or create a chat to begin
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-64 border-l border-gray-200 dark:border-gray-700">
          <RightPanel 
            activeChatId={selectedChatId}
            tools={tools}
            systemPrompts={systemPrompts}
            onCreateTool={handleCreateTool}
            onAssignTool={handleAssignTool}
            onDeleteTool={async (id) => console.log('Delete tool:', id)}
            onUpdateTool={async (id, tool) => console.log('Update tool:', id, tool)}
            onRefreshTools={async () => console.log('Refresh tools')}
            loading={false}
            onAssignSystemPrompt={async (id) => console.log('Assign prompt:', id)}
            onDeleteSystemPrompt={async (id) => console.log('Delete prompt:', id)}
            onRefreshSystemPrompts={async () => console.log('Refresh prompts')}
          />
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;