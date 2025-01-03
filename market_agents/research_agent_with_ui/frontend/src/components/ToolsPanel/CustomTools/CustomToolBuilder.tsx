import React from 'react';
import { Plus, Settings2 } from 'lucide-react';
import { useCustomTools } from '../../../hooks/useCustomTools';
import { SchemaBuilder } from './SchemaBuilder';

export const CustomToolBuilder: React.FC = () => {
  const { tools, isBuilding, startBuilding, cancelBuilding, saveTool } = useCustomTools();

  return (
    <div className="mt-6 border-t border-gray-700 pt-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Settings2 size={18} className="text-gray-400" />
          <h3 className="font-medium">Custom Tools</h3>
        </div>
        <button
          onClick={startBuilding}
          className="p-1.5 rounded-md hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>

      {isBuilding && (
        <SchemaBuilder
          onCancel={cancelBuilding}
          onSave={saveTool}
        />
      )}

      <div className="space-y-2">
        {tools.map((tool) => (
          <div
            key={tool.id}
            className="p-3 rounded-lg bg-gray-700/50 text-sm"
          >
            <div className="font-medium">{tool.name}</div>
            <div className="text-xs text-gray-400">{tool.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

