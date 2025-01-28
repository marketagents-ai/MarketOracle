import React, { useState, useEffect } from 'react';
import { Plus, Settings2, Trash2 } from 'lucide-react';
import { Switch } from '../Switch';
import { SchemaBuilder } from './SchemaBuilder';

export const CustomToolBuilder: React.FC = () => {
  const [customTools, setCustomTools] = useState<any[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);

  useEffect(() => {
    // Load custom tools from localStorage
    const loadCustomTools = () => {
      const savedTools = localStorage.getItem('customTools');
      if (savedTools) {
        setCustomTools(JSON.parse(savedTools));
      }
    };

    loadCustomTools();
    // Listen for updates
    window.addEventListener('customToolsUpdated', loadCustomTools);
    return () => window.removeEventListener('customToolsUpdated', loadCustomTools);
  }, []);

  const handleDelete = (toolId: string) => {
    const updatedTools = customTools.filter(tool => tool.id !== toolId);
    localStorage.setItem('customTools', JSON.stringify(updatedTools));
    setCustomTools(updatedTools);
    window.dispatchEvent(new Event('customToolsUpdated'));
  };

  const handleSaveTool = (newTool: any) => {
    const updatedTools = [...customTools, { ...newTool, id: Date.now().toString() }];
    localStorage.setItem('customTools', JSON.stringify(updatedTools));
    setCustomTools(updatedTools);
    setIsBuilding(false);
    window.dispatchEvent(new Event('customToolsUpdated'));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Settings2 size={18} className="text-gray-400" />
          <h3 className="font-medium">Custom Tools</h3>
        </div>
        <button
          onClick={() => setIsBuilding(true)}
          className="p-1.5 rounded-md hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>

      {isBuilding && (
        <SchemaBuilder
          onCancel={() => setIsBuilding(false)}
          onSave={handleSaveTool}
        />
      )}

      {customTools.map((tool) => (
        <div
          key={tool.id}
          className="group flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
        >
          <div>
            <h4 className="text-sm font-medium text-white">{tool.name}</h4>
            <p className="text-xs text-gray-400">{tool.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={tool.enabled}
              onCheckedChange={(checked) => {
                const updatedTool = { ...tool, enabled: checked };
                const updatedTools = customTools.map(t => 
                  t.id === tool.id ? updatedTool : t
                );
                localStorage.setItem('customTools', JSON.stringify(updatedTools));
                setCustomTools(updatedTools);
              }}
              className="data-[state=checked]:bg-blue-600"
            />
            <button 
              onClick={() => handleDelete(tool.id)}
              className="p-1.5 rounded-md hover:bg-gray-700 text-red-400 hover:text-red-300"
              aria-label="Delete tool"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// import React from 'react';
// import { Plus, Settings2 } from 'lucide-react';
// import { useCustomTools } from '../../../hooks/useCustomTools';
// import { SchemaBuilder } from './SchemaBuilder';

// export const CustomToolBuilder: React.FC = () => {
//   const { tools, isBuilding, startBuilding, cancelBuilding, saveTool } = useCustomTools();

//   return (
//     <div className="mt-6 border-t border-gray-700 pt-4">
//       <div className="flex items-center justify-between mb-4">
//         <div className="flex items-center gap-2">
//           <Settings2 size={18} className="text-gray-400" />
//           <h3 className="font-medium">Custom Tools</h3>
//         </div>
//         <button
//           onClick={startBuilding}
//           className="p-1.5 rounded-md hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
//         >
//           <Plus size={18} />
//         </button>
//       </div>

//       {isBuilding && (
//         <SchemaBuilder
//           onCancel={cancelBuilding}
//           onSave={saveTool}
//         />
//       )}

//       <div className="space-y-2">
//         {tools.map((tool) => (
//           <div
//             key={tool.id}
//             className="p-3 rounded-lg bg-gray-700/50 text-sm"
//           >
//             <div className="font-medium">{tool.name}</div>
//             <div className="text-xs text-gray-400">{tool.description}</div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

