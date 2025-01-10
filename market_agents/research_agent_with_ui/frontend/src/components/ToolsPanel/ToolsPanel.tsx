import React, { useState } from 'react';
import { Settings, Plus } from 'lucide-react';
import { TabSelector } from './TabSelector';
import { ToolsList } from './ToolsList';
import { SystemTab } from './SystemTab/SystemTab';
import { CustomToolBuilder } from './CustomTools/CustomToolBuilder';

export const ToolsPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'system' | 'tools'>('system');
  const [isAddingTool, setIsAddingTool] = useState(false);

  return (
    <div className="w-80 border-l border-gray-800 bg-[#1a1b1e] flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <TabSelector activeTab={activeTab} onChange={setActiveTab} />
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'system' ? (
          <SystemTab />
        ) : (
          <div className="p-4">
            {/* Custom Tools Section at Top */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Custom Tools</h2>
                <button
                  className="p-2 hover:bg-gray-700 rounded-lg"
                  onClick={() => setIsAddingTool(true)}
                >
                  <Plus size={20} />
                </button>
              </div>
              <CustomToolBuilder />
            </div>

            {/* System Tools Sections at Bottom */}
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium mb-4">Executable Tools</h2>
                <ToolsList type="executable" />
              </div>
              
              <div>
                <h2 className="text-lg font-medium mb-4">Typed Tools</h2>
                <ToolsList type="typed" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


// import React, { useState } from 'react';
// import { Settings, Plus } from 'lucide-react';
// import { TabSelector } from './TabSelector';
// import { ToolsList } from './ToolsList';
// import { SystemTab } from './SystemTab/SystemTab';
// import { CustomToolBuilder } from './CustomTools/CustomToolBuilder';

// export const ToolsPanel: React.FC = () => {
//   const [activeTab, setActiveTab] = useState<'system' | 'tools'>('system');
//   const [isAddingTool, setIsAddingTool] = useState(false);

//   return (
//     <div className="w-80 border-l border-gray-800 bg-[#1a1b1e] flex flex-col">
//       <div className="p-4 border-b border-gray-800">
//         <TabSelector activeTab={activeTab} onChange={setActiveTab} />
//       </div>
      
//       <div className="flex-1 overflow-y-auto">
//         <div className="p-4">
//           {activeTab === 'system' ? (
//             <SystemTab />
//           ) : (
//             <div className="space-y-6">
//               <div className="flex items-center justify-between mb-6">
//                 <h2 className="text-xl font-semibold text-white">Tools</h2>
//                 <button 
//                   className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
//                   aria-label="Refresh tools"
//                 >
//                   <Settings size={20} />
//                 </button>
//               </div>

//               <section>
//                 <h3 className="text-gray-400 text-sm font-medium mb-3">Executable Tools</h3>
//                 <ToolsList type="executable" />
//               </section>

//               <section>
//                 <h3 className="text-gray-400 text-sm font-medium mb-3">Typed Tools</h3>
//                 <ToolsList type="typed" />
//               </section>

//               <section>
//                 <div className="flex items-center justify-between mb-3">
//                   <h3 className="text-gray-400 text-sm font-medium">Custom Tools</h3>
//                   <button 
//                     onClick={() => setIsAddingTool(true)}
//                     className="p-1.5 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
//                     aria-label="Add custom tool"
//                   >
//                     <Plus size={16} />
//                   </button>
//                 </div>
//                 {isAddingTool && (
//                   <CustomToolBuilder onClose={() => setIsAddingTool(false)} />
//                 )}
//               </section>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

