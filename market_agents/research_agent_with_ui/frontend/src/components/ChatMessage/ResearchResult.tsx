// import React, { useState } from 'react';
// import type { ResearchData } from '../../types/research';
// import { ChevronDown, ChevronUp } from 'lucide-react';

// interface ResearchResultProps {
//   data: ResearchData[];
// }

// export const ResearchResult: React.FC<ResearchResultProps> = ({ data }) => {
//   const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});

//   return (
//     <div className="flex flex-col gap-4 w-full max-w-full overflow-hidden">
//       {data.map((item, index) => (
//         <div 
//           key={index}
//           className="bg-gray-800 rounded-lg p-4 overflow-hidden break-words"
//         >
//           <div 
//             className="flex items-center justify-between cursor-pointer"
//             onClick={() => setExpandedItems(prev => ({
//               ...prev,
//               [index]: !prev[index]
//             }))}
//           >
//             <h3 className="font-medium text-lg text-white truncate pr-4">
//               {item.title || item.url}
//             </h3>
//             {expandedItems[index] ? <ChevronUp /> : <ChevronDown />}
//           </div>

//           {expandedItems[index] && (
//             <div className="mt-4 space-y-4">
//               {/* Summary Section */}
//               <div className="space-y-2">
//                 <h4 className="font-medium text-blue-400">Summary</h4>
//                 <p className="text-sm text-gray-300 whitespace-pre-wrap break-words">
//                   {item.summary?.summary}
//                 </p>
//               </div>

//               {/* Key Points */}
//               {item.summary?.key_points && item.summary.key_points.length > 0 && (
//                 <div className="space-y-2">
//                   <h4 className="font-medium text-blue-400">Key Points</h4>
//                   <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
//                     {item.summary.key_points.map((point, i) => (
//                       <li key={i} className="break-words">{point}</li>
//                     ))}
//                   </ul>
//                 </div>
//               )}

//               {/* Source Info */}
//               <div className="text-sm text-gray-400 pt-2 border-t border-gray-700">
//                 <p className="break-words">
//                   Source: <a 
//                     href={item.url} 
//                     className="text-blue-400 hover:underline" 
//                     target="_blank" 
//                     rel="noopener noreferrer"
//                   >
//                     {item.url}
//                   </a>
//                 </p>
//                 <p>Last Updated: {new Date(item.timestamp).toLocaleString()}</p>
//               </div>
//             </div>
//           )}
//         </div>
//       ))}
//     </div>
//   );
// };

////////////////////////////////////////////////////////


import React, { useState } from 'react';
import type { ResearchData } from '../../types/research';

interface ResearchResultProps {
  data: ResearchData[];  // Change to array type
}

export const ResearchResult: React.FC<ResearchResultProps> = ({ data }) => {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});

  if (!Array.isArray(data)) {
    return null;
  }

  const toggleExpand = (index: number) => {
    setExpandedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="space-y-4">
      {data.map((result, index) => (
        <div key={index} className="bg-gray-800 rounded-lg p-4">
          <div 
            className="border-b border-gray-700 pb-3 cursor-pointer"
            onClick={() => toggleExpand(index)}
          >
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">{result.title}</h3>
              <span className="text-gray-400">
                {expandedItems[index] ? '▼' : '▶'}
              </span>
            </div>
            
            {/* Source URL and Timestamp */}
            <div className="text-sm text-gray-400 mt-2">
              <a 
                href={result.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {new URL(result.url).hostname}
              </a>
              <span className="mx-2">•</span>
              <span>{new Date(result.timestamp).toLocaleString()}</span>
            </div>
          </div>

          {/* Expanded Content */}
          {expandedItems[index] && (
            <div className="mt-4 space-y-4">
              {/* Content Preview */}
              <div className="bg-gray-700/50 p-4 rounded">
                <h4 className="font-medium mb-2">Content Preview</h4>
                <p className="text-sm text-gray-300 whitespace-pre-wrap">
                  {result.content.substring(0, 300)}...
                </p>
              </div>

              {/* Summary if available */}
              {result.summary && Object.keys(result.summary).length > 0 && (
                <div className="bg-gray-700/50 p-4 rounded">
                  <h4 className="font-medium mb-2">Analysis Summary</h4>
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(result.summary, null, 2)}
                  </pre>
                </div>
              )}

              {/* Metadata */}
              <div className="text-xs text-gray-400">
                <span>Status: {result.status}</span>
                <span className="mx-2">•</span>
                <span>Method: {result.extraction_method}</span>
                {result.agent_id && (
                  <>
                    <span className="mx-2">•</span>
                    <span>Agent: {result.agent_id}</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

///////////////////////////////////////////////////////
// import React, { useState } from 'react';
// import type { ResearchData } from '../../types/research';

// interface ResearchResultProps {
//   data: ResearchData;
// }


// export const ResearchResult: React.FC<ResearchResultProps> = ({ data }) => {
//   const [isExpanded, setIsExpanded] = useState(false);

//   if (!data || typeof data !== 'object') {
//     return null;
//   }

//   return (
//     <div className="bg-gray-800 rounded-lg p-4 space-y-4">
//       {/* Title and Source */}
//       <div 
//         className="border-b border-gray-700 pb-3 cursor-pointer"
//         onClick={() => setIsExpanded(!isExpanded)}
//       >
//         <div className="flex justify-between items-center">
//           <h3 className="text-lg font-medium mb-2">{data.title}</h3>
//           <span className="text-gray-400">
//             {isExpanded ? '▼' : '▶'}
//           </span>
//         </div>
//         <div className="text-sm text-gray-400">
//           <a 
//             href={data.url} 
//             target="_blank" 
//             rel="noopener noreferrer" 
//             className="hover:underline"
//             onClick={(e) => e.stopPropagation()}
//           >
//             View Source
//           </a>
//           <span className="mx-2">•</span>
//           <span>{new Date(data.timestamp).toLocaleString()}</span>
//         </div>
//       </div>

//       {isExpanded && data.summary && (
//         <div className="space-y-4">
//           {/* Main Summary */}
//           <div className="bg-gray-700/50 p-4 rounded">
//             <h4 className="font-medium mb-2">Summary</h4>
//             <p className="text-gray-300 whitespace-pre-wrap">{data.summary.summary}</p>
//           </div>

//           {/* Market Analysis */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div className="bg-gray-700/50 p-4 rounded">
//               <h4 className="font-medium mb-2">Price Analysis</h4>
//               <div className="space-y-2">
//                 <p><span className="font-medium">Current Price:</span> {data.summary.price_analysis.current_price}</p>
//                 <div>
//                   <p className="font-medium">Target Prices:</p>
//                   <ul className="list-disc list-inside pl-4">
//                     <li>Short Term: {data.summary.price_analysis.target_prices.short_term.join(', ')}</li>
//                     <li>Medium Term: {data.summary.price_analysis.target_prices.medium_term.join(', ')}</li>
//                     <li>Long Term: {data.summary.price_analysis.target_prices.long_term.join(', ')}</li>
//                   </ul>
//                 </div>
//               </div>
//             </div>

//             <div className="bg-gray-700/50 p-4 rounded">
//               <h4 className="font-medium mb-2">Technical Analysis</h4>
//               <div className="space-y-2">
//                 <p><span className="font-medium">Trend:</span> {data.summary.technical_analysis.trend_direction}</p>
//                 <p><span className="font-medium">RSI:</span> {data.summary.technical_analysis.indicators.rsi}</p>
//                 <p><span className="font-medium">MACD:</span> {data.summary.technical_analysis.indicators.macd}</p>
//               </div>
//             </div>
//           </div>

//           {/* Risk Assessment */}
//           <div className="bg-gray-700/50 p-4 rounded">
//             <h4 className="font-medium mb-2">Risk Assessment</h4>
//             <div className="space-y-2">
//               <p><span className="font-medium">Risk Level:</span> {data.summary.risk_assessment.risk_level}</p>
//               <p><span className="font-medium">Risk/Reward Ratio:</span> {data.summary.risk_assessment.risk_reward_ratio}</p>
//               <div>
//                 <p className="font-medium">Risk Factors:</p>
//                 <ul className="list-disc list-inside pl-4">
//                   {data.summary.risk_assessment.risk_factors.map((factor, index) => (
//                     <li key={index}>{factor}</li>
//                   ))}
//                 </ul>
//               </div>
//             </div>
//           </div>

//           {/* Trading Implications */}
//           <div className="bg-gray-700/50 p-4 rounded">
//             <h4 className="font-medium mb-2">Trading Strategy</h4>
//             <div className="space-y-2">
//               <div>
//                 <p className="font-medium">Entry Points:</p>
//                 <ul className="list-disc list-inside pl-4">
//                   {data.summary.trading_implications.entry_points.map((point, index) => (
//                     <li key={index}>{point}</li>
//                   ))}
//                 </ul>
//               </div>
//               <div>
//                 <p className="font-medium">Exit Targets:</p>
//                 <ul className="list-disc list-inside pl-4">
//                   {data.summary.trading_implications.exit_targets.map((target, index) => (
//                     <li key={index}>{target}</li>
//                   ))}
//                 </ul>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };
// Number 2
// import React from 'react';
// import type { ResearchData } from '../../types/research';

// interface ResearchResultProps {
//   data: ResearchData;
// }

// export const ResearchResult: React.FC<ResearchResultProps> = ({ data }) => {
//   if (!data || typeof data !== 'object') {
//     return null;
//   }

//   return (
//     <div className="bg-gray-700 text-white rounded-lg p-4 mb-4 max-w-[80%]">
//       <h3 className="font-medium mb-2">{data.title}</h3>
//       {data.summary && (
//         <div className="space-y-3">
//           <p className="text-sm text-gray-300">{data.summary.summary}</p>
          
//           {data.summary.key_points && data.summary.key_points.length > 0 && (
//             <div>
//               <h4 className="text-sm font-medium mb-1">Key Points</h4>
//               <ul className="list-disc list-inside text-sm text-gray-300">
//                 {data.summary.key_points.map((point, index) => (
//                   <li key={index}>{point}</li>
//                 ))}
//               </ul>
//             </div>
//           )}
//         </div>
//       )}

//       <div className="mt-3 text-xs text-gray-400">
//         <a 
//           href={data.url} 
//           target="_blank" 
//           rel="noopener noreferrer" 
//           className="hover:underline"
//         >
//           View Source
//         </a>
//         <span className="mx-2">•</span>
//         <span>{new Date(data.timestamp).toLocaleString()}</span>
//       </div>
//     </div>
//   );
// };



// Number 1
// export const ResearchResult: React.FC<ResearchResultProps> = ({ data }) => {
//   return (
//     <div className="bg-gray-700 text-white rounded-lg p-4 mb-4 max-w-[80%]">
//       <h3 className="font-medium mb-2">{data.title.split('#').pop()}</h3>
      
//       <div className="mb-4">
//         <h4 className="font-medium mb-2">Summary</h4>
//         <p>{data.summary.summary}</p>
        
//         <div className="mt-2">
//           <h5 className="font-medium mb-1">Key Points</h5>
//           <ul className="list-disc list-inside">
//             {data.summary.key_points.map((point, index) => (
//               <li key={index}>{point}</li>
//             ))}
//           </ul>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//         <div className="bg-gray-600 p-3 rounded">
//           <h4 className="font-medium mb-2">Market Impact</h4>
//           <div className="space-y-1">
//             <p><span className="font-medium">Short Term:</span> {data.summary.market_impact.short_term}</p>
//             <p><span className="font-medium">Medium Term:</span> {data.summary.market_impact.medium_term}</p>
//             <p><span className="font-medium">Long Term:</span> {data.summary.market_impact.long_term}</p>
//           </div>
//         </div>

//         <div className="bg-gray-600 p-3 rounded">
//           <h4 className="font-medium mb-2">Risk Assessment</h4>
//           <p><span className="font-medium">Risk Level:</span> {data.summary.risk_assessment.risk_level}</p>
//           <p><span className="font-medium">Risk/Reward:</span> {data.summary.risk_assessment.risk_reward_ratio}</p>
//         </div>
//       </div>

//       <div className="mt-3 text-sm text-gray-400">
//         <a 
//           href={data.url} 
//           target="_blank" 
//           rel="noopener noreferrer" 
//           className="hover:underline"
//         >
//           View Source
//         </a>
//         <span className="mx-2">•</span>
//         <span>{new Date(data.timestamp).toLocaleString()}</span>
//       </div>
//     </div>
//   );
// };