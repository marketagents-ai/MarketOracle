import React from 'react';
import { Plus, Settings2 } from 'lucide-react';
import { useCustomTools } from '../../../hooks/useCustomTools';
import { SchemaBuilder } from './SchemaBuilder';
import { Switch } from '../Switch';

export const CustomToolBuilder: React.FC = () => {
  const { tools, isBuilding, startBuilding, cancelBuilding, saveTool } = useCustomTools();

  const handleToggle = (toolId: string, enabled: boolean) => {
    // Implement toggle logic here
    console.log(`Custom tool ${toolId} ${enabled ? 'enabled' : 'disabled'}`);
  };

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

      <div className="space-y-2">
        {tools.map((tool) => (
          <div
            key={tool.id}
            className="group flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
          >
            <div>
              <div className="font-medium text-sm text-white">{tool.name}</div>
              <div className="text-xs text-gray-400">{tool.description}</div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={tool.enabled}
                onCheckedChange={(checked) => handleToggle(tool.id, checked)}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>
          </div>
        ))}
      </div>

      {isBuilding && (
        <SchemaBuilder onClose={cancelBuilding} onSave={saveTool} />
      )}
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

