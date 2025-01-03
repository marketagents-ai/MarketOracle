import React from 'react';
import { Trash2 } from 'lucide-react';
import { AVAILABLE_TOOLS } from './tools.config';

interface ToolsListProps {
  type: 'executable' | 'typed';
}

export const ToolsList: React.FC<ToolsListProps> = ({ type }) => {
  const tools = AVAILABLE_TOOLS.filter(tool => tool.type === type);

  return (
    <div className="space-y-2">
      {tools.map((tool) => (
        <div
          key={tool.id}
          className="group flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-gray-700/50">
              <tool.icon size={18} className="text-blue-400" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-white">{tool.name}</h4>
              <p className="text-xs text-gray-400">{tool.description}</p>
            </div>
          </div>
          <button className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-gray-700 text-gray-400 hover:text-white transition-all">
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

