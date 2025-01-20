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
import { Download } from 'lucide-react';

interface ResearchResultProps {
  data: ResearchData[];
}

export const ResearchResult: React.FC<ResearchResultProps> = ({ data }) => {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [isTableExpanded, setIsTableExpanded] = useState(true);

  if (!Array.isArray(data)) {
    return null;
  }

  const toggleExpand = (index: number) => {
    setExpandedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Function to convert array to CSV
  const convertToCSV = (analysisData: any[]) => {
    const headers = [
      'Ticker',
      'Rating',
      'Target Price',
      'Sentiment',
      'Action',
      'Catalysts',
      'KPIs',
      'Sources'
    ];

    const rows = analysisData.map(item => [
      item.ticker,
      item.rating,
      item.targetPrice,
      item.sentiment,
      item.action,
      (item.catalysts || []).join('|'),
      (item.kpis || []).join('|'),
      (item.sources || []).join('|')
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  };

  // Function to download CSV
  const downloadCSV = (analysisData: any[]) => {
    const csv = convertToCSV(analysisData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `market_analysis_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderSummaryTable = () => {
    const analysisData = data.map(item => {
      try {
        const summary = typeof item.summary === 'string' ? 
          JSON.parse(item.summary) : item.summary;
        if (summary.assets && summary.assets.length > 0) {
          const asset = summary.assets[0];
          return {
            ticker: asset.ticker,
            rating: asset.rating,
            targetPrice: asset.target_price,
            sentiment: asset.sentiment,
            action: asset.action,
            catalysts: asset.catalysts,
            kpis: asset.kpis,
            sources: asset.sources
          };
        }
      } catch (e) {
        console.error('Error parsing summary:', e);
      }
      return null;
    }).filter(Boolean);

    if (analysisData.length === 0) return null;

    return (
      <div className="bg-gray-800 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center mb-4">
          <div 
            className="flex items-center cursor-pointer"
            onClick={() => setIsTableExpanded(!isTableExpanded)}
          >
            <h3 className="text-lg font-medium">Market Analysis Summary</h3>
            <span className="text-gray-400 ml-2">
              {isTableExpanded ? '▼' : '▶'}
            </span>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              downloadCSV(analysisData);
            }}
            className="flex items-center gap-2 px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm"
            title="Download as CSV"
          >
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>

        <div className="text-sm text-gray-400 mb-4">
          <p>Below are detailed analysis results from each source. Click on individual items to expand and view full content, summaries, and metadata.</p>
          <div className="mt-2 text-xs">
            <span className="inline-flex items-center mr-4">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              Bullish
            </span>
            <span className="inline-flex items-center mr-4">
              <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
              Bearish
            </span>
            <span className="inline-flex items-center">
              <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
              Neutral
            </span>
          </div>
        </div>

        {isTableExpanded && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs uppercase bg-gray-700">
                <tr>
                  <th className="px-4 py-3">Ticker</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Target Price</th>
                  <th className="px-4 py-3">Sentiment</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Catalysts</th>
                  <th className="px-4 py-3">KPIs</th>
                  <th className="px-4 py-3">Sources</th>
                </tr>
              </thead>
              <tbody>
                {analysisData.map((item, index) => (
                  <tr key={index} className="border-b border-gray-700 bg-gray-800/50">
                    <td className="px-4 py-3">{item.ticker}</td>
                    <td className="px-4 py-3 max-w-[200px] truncate">{item.rating}</td>
                    <td className="px-4 py-3">{item.targetPrice}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        item.sentiment === 'Bullish' ? 'bg-green-500/20 text-green-400' :
                        item.sentiment === 'Bearish' ? 'bg-red-500/20 text-red-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {item.sentiment}
                      </span>
                    </td>
                    <td className="px-4 py-3">{item.action}</td>
                    <td className="px-4 py-3">
                      <ul className="list-disc list-inside">
                        {item.catalysts?.map((catalyst: string, i: number) => (
                          <li key={i} className="truncate max-w-[200px]" title={catalyst}>
                            {catalyst}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3">
                      <ul className="list-disc list-inside">
                        {item.kpis?.map((kpi: string, i: number) => (
                          <li key={i} className="truncate max-w-[200px]" title={kpi}>
                            {kpi}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3">
                      <ul className="list-disc list-inside">
                        {item.sources?.map((source: string, i: number) => (
                          <li key={i} className="truncate max-w-[200px]" title={source}>
                            {source}
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderSummaryTable()}

      {/* Source Analysis Details Container */}
      <div className="bg-gray-800 rounded-lg p-4 mb-4">
        {/* Header Section */}
        <div className="text-sm text-gray-400 mb-6">
          <h4 className="text-lg font-medium text-white mb-2">Source Analysis Details</h4>
          <p>Below are detailed analyses from each source URL. Each entry contains:</p>
          <ul className="mt-2 space-y-1">
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
              <span>Content preview from the source</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
              <span>Detailed market analysis and insights</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
              <span>Source metadata and extraction information</span>
            </li>
          </ul>
          <div className="mt-4 text-xs bg-gray-700/50 p-3 rounded">
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Click on each item to expand and view the complete analysis.</span>
            </div>
          </div>
        </div>

        {/* URL Cards Container */}
        <div className="space-y-3">
          {data.map((result, index) => (
            <div key={index} className="bg-gray-700/30 rounded-lg p-4 hover:bg-gray-700/50 transition-colors duration-200">
              <div 
                className="cursor-pointer"
                onClick={() => toggleExpand(index)}
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-white hover:text-blue-400 transition-colors duration-200">
                    {result.title || new URL(result.url).hostname}
                  </h3>
                  <span className="text-gray-400">
                    {expandedItems[index] ? '▼' : '▶'}
                  </span>
                </div>
                
                <div className="text-sm text-gray-400 mt-2 flex items-center space-x-3">
                  <a 
                    href={result.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-blue-400 transition-colors duration-200 flex items-center space-x-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span>{new URL(result.url).hostname}</span>
                  </a>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{new Date(result.timestamp).toLocaleString()}</span>
                  </span>
                </div>
              </div>

              {expandedItems[index] && (
                <div className="mt-4 space-y-4">
                  <div className="bg-gray-700/50 p-4 rounded">
                    <h4 className="font-medium mb-2">Content Preview</h4>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">
                      {result.content.substring(0, 300)}...
                    </p>
                  </div>

                  {result.summary && Object.keys(result.summary).length > 0 && (
                    <div className="bg-gray-700/50 p-4 rounded">
                      <h4 className="font-medium mb-2">Analysis Summary</h4>
                      <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto">
                        {JSON.stringify(result.summary, null, 2)}
                      </pre>
                    </div>
                  )}

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
      </div>
    </div>
  );
};
// NEW UPDATE
// import React, { useState } from 'react';
// import type { ResearchData } from '../../types/research';
// import { Download } from 'lucide-react';

// interface ResearchResultProps {
//   data: ResearchData[];
// }

// export const ResearchResult: React.FC<ResearchResultProps> = ({ data }) => {
//   const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
//   const [isTableExpanded, setIsTableExpanded] = useState(true);

//   if (!Array.isArray(data)) {
//     return null;
//   }

//   const toggleExpand = (index: number) => {
//     setExpandedItems(prev => ({
//       ...prev,
//       [index]: !prev[index]
//     }));
//   };

//   // Function to convert array to CSV
//   const convertToCSV = (analysisData: any[]) => {
//     const headers = [
//       'Ticker',
//       'Rating',
//       'Target Price',
//       'Sentiment',
//       'Action',
//       'Catalysts',
//       'KPIs',
//       'Sources'
//     ];

//     const rows = analysisData.map(item => [
//       item.ticker,
//       item.rating,
//       item.targetPrice,
//       item.sentiment,
//       item.action,
//       (item.catalysts || []).join('|'),
//       (item.kpis || []).join('|'),
//       (item.sources || []).join('|')
//     ]);

//     return [headers, ...rows]
//       .map(row => row.map(cell => `"${cell}"`).join(','))
//       .join('\n');
//   };

//   // Function to download CSV
//   const downloadCSV = (analysisData: any[]) => {
//     const csv = convertToCSV(analysisData);
//     const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
//     const link = document.createElement('a');
//     const url = URL.createObjectURL(blob);
    
//     link.setAttribute('href', url);
//     link.setAttribute('download', `market_analysis_${new Date().toISOString().split('T')[0]}.csv`);
//     link.style.visibility = 'hidden';
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   const renderSummaryTable = () => {
//     const analysisData = data.map(item => {
//       try {
//         const summary = typeof item.summary === 'string' ? 
//           JSON.parse(item.summary) : item.summary;
//         if (summary.assets && summary.assets.length > 0) {
//           const asset = summary.assets[0];
//           return {
//             ticker: asset.ticker,
//             rating: asset.rating,
//             targetPrice: asset.target_price,
//             sentiment: asset.sentiment,
//             action: asset.action,
//             catalysts: asset.catalysts,
//             kpis: asset.kpis,
//             sources: asset.sources
//           };
//         }
//       } catch (e) {
//         console.error('Error parsing summary:', e);
//       }
//       return null;
//     }).filter(Boolean);

//     if (analysisData.length === 0) return null;

//     return (
//       <div className="bg-gray-800 rounded-lg p-4 mb-4">
//         <div className="flex justify-between items-center mb-4">
//           <div 
//             className="flex items-center cursor-pointer"
//             onClick={() => setIsTableExpanded(!isTableExpanded)}
//           >
//             <h3 className="text-lg font-medium">Market Analysis Summary</h3>
//             <span className="text-gray-400 ml-2">
//               {isTableExpanded ? '▼' : '▶'}
//             </span>
//           </div>
          
//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               downloadCSV(analysisData);
//             }}
//             className="flex items-center gap-2 px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm"
//             title="Download as CSV"
//           >
//             <Download size={16} />
//             <span>Export</span>
//           </button>
          
//         </div>
//         <div className="text-sm text-gray-400 mb-4">
//           <p>Below are detailed analysis results from each source. Click on individual items to expand and view full content, summaries, and metadata.</p>
//           <div className="mt-2 text-xs">
//             <span className="inline-flex items-center mr-4">
//               <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
//               Bullish
//             </span>
//             <span className="inline-flex items-center mr-4">
//               <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
//               Bearish
//             </span>
//             <span className="inline-flex items-center">
//               <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
//               Neutral
//             </span>
//           </div>
//         </div>


//         {isTableExpanded && (
//           <div className="overflow-x-auto">
//             <table className="w-full text-sm text-left text-gray-300">
//               <thead className="text-xs uppercase bg-gray-700">
//                 <tr>
//                   <th className="px-4 py-3">Ticker</th>
//                   <th className="px-4 py-3">Rating</th>
//                   <th className="px-4 py-3">Target Price</th>
//                   <th className="px-4 py-3">Sentiment</th>
//                   <th className="px-4 py-3">Action</th>
//                   <th className="px-4 py-3">Catalysts</th>
//                   <th className="px-4 py-3">KPIs</th>
//                   <th className="px-4 py-3">Sources</th>
//                 </tr>
//               </thead>
              
//               <tbody>
//                 {analysisData.map((item, index) => (
//                   <tr key={index} className="border-b border-gray-700 bg-gray-800/50">
//                     <td className="px-4 py-3">{item.ticker}</td>
//                     <td className="px-4 py-3 max-w-[200px] truncate">{item.rating}</td>
//                     <td className="px-4 py-3">{item.targetPrice}</td>
//                     <td className="px-4 py-3">
//                       <span className={`px-2 py-1 rounded text-xs ${
//                         item.sentiment === 'Bullish' ? 'bg-green-500/20 text-green-400' :
//                         item.sentiment === 'Bearish' ? 'bg-red-500/20 text-red-400' :
//                         'bg-gray-500/20 text-gray-400'
//                       }`}>
//                         {item.sentiment}
//                       </span>
//                     </td>
//                     <td className="px-4 py-3">{item.action}</td>
//                     <td className="px-4 py-3">
//                       <ul className="list-disc list-inside">
//                         {item.catalysts?.map((catalyst: string, i: number) => (
//                           <li key={i} className="truncate max-w-[200px]" title={catalyst}>
//                             {catalyst}
//                           </li>
//                         ))}
//                       </ul>
//                     </td>
//                     <td className="px-4 py-3">
//                       <ul className="list-disc list-inside">
//                         {item.kpis?.map((kpi: string, i: number) => (
//                           <li key={i} className="truncate max-w-[200px]" title={kpi}>
//                             {kpi}
//                           </li>
//                         ))}
//                       </ul>
//                     </td>
//                     <td className="px-4 py-3">
//                       <ul className="list-disc list-inside">
//                         {item.sources?.map((source: string, i: number) => (
//                           <li key={i} className="truncate max-w-[200px]" title={source}>
//                             {source}
//                           </li>
//                         ))}
//                       </ul>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>
//     );
//   };

//   return (
//     <div className="space-y-4">
//       {renderSummaryTable()}
// {/* Add description for URL analyses */}
// <div className="bg-gray-800 rounded-lg p-4 mb-4">
//   <div className="text-sm text-gray-400">
//     <h4 className="text-lg font-medium text-white mb-2">Source Analysis Details</h4>
//     <p>Below are detailed analyses from each source URL. Each entry contains:</p>
//     <ul className="mt-2 space-y-1">
//       <li className="flex items-center space-x-2">
//         <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
//         <span>Content preview from the source</span>
//       </li>
//       <li className="flex items-center space-x-2">
//         <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
//         <span>Detailed market analysis and insights</span>
//       </li>
//       <li className="flex items-center space-x-2">
//         <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
//         <span>Source metadata and extraction information</span>
//       </li>
//     </ul>
//     <div className="mt-4 text-xs bg-gray-700/50 p-3 rounded">
//       <div className="flex items-center space-x-1">
//         <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//         </svg>
//         <span>Click on each item to expand and view the complete analysis.</span>
//       </div>
//     </div>
//   </div>
// </div>
// {/* Update the URL cards styling */}
// {data.map((result, index) => (
//   <div key={index} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-800/80 transition-colors duration-200">
//     <div 
//       className="border-b border-gray-700 pb-3 cursor-pointer"
//       onClick={() => toggleExpand(index)}
//     >
//       <div className="flex justify-between items-center">
//         <h3 className="text-lg font-medium text-white hover:text-blue-400 transition-colors duration-200">
//           {result.title || new URL(result.url).hostname}
//         </h3>
//         <span className="text-gray-400">
//           {expandedItems[index] ? '▼' : '▶'}
//         </span>
//       </div>
      
//       <div className="text-sm text-gray-400 mt-2 flex items-center space-x-3">
//         <a 
//           href={result.url} 
//           target="_blank" 
//           rel="noopener noreferrer" 
//           className="hover:text-blue-400 transition-colors duration-200 flex items-center space-x-1"
//           onClick={(e) => e.stopPropagation()}
//         >
//           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
//           </svg>
//           <span>{new URL(result.url).hostname}</span>
//         </a>
//         <span>•</span>
//         <span className="flex items-center space-x-1">
//           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//           </svg>
//           <span>{new Date(result.timestamp).toLocaleString()}</span>
//         </span>
//       </div>
//     </div>

//           {expandedItems[index] && (
//             <div className="mt-4 space-y-4">
//               <div className="bg-gray-700/50 p-4 rounded">
//                 <h4 className="font-medium mb-2">Content Preview</h4>
//                 <p className="text-sm text-gray-300 whitespace-pre-wrap">
//                   {result.content.substring(0, 300)}...
//                 </p>
//               </div>

//               {result.summary && Object.keys(result.summary).length > 0 && (
//                 <div className="bg-gray-700/50 p-4 rounded">
//                   <h4 className="font-medium mb-2">Analysis Summary</h4>
//                   <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto">
//                     {JSON.stringify(result.summary, null, 2)}
//                   </pre>
//                 </div>
//               )}

//               <div className="text-xs text-gray-400">
//                 <span>Status: {result.status}</span>
//                 <span className="mx-2">•</span>
//                 <span>Method: {result.extraction_method}</span>
//                 {result.agent_id && (
//                   <>
//                     <span className="mx-2">•</span>
//                     <span>Agent: {result.agent_id}</span>
//                   </>
//                 )}
//               </div>
//             </div>
//           )}
//         </div>
//       ))}
//     </div>
//   );
// };
// TABLE V2
// import React, { useState } from 'react';
// import type { ResearchData } from '../../types/research';

// interface ResearchResultProps {
//   data: ResearchData[];
// }

// export const ResearchResult: React.FC<ResearchResultProps> = ({ data }) => {
//   const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
//   const [isTableExpanded, setIsTableExpanded] = useState(true);

//   if (!Array.isArray(data)) {
//     return null;
//   }

//   const toggleExpand = (index: number) => {
//     setExpandedItems(prev => ({
//       ...prev,
//       [index]: !prev[index]
//     }));
//   };

//   const renderSummaryTable = () => {
//     const analysisData = data.map(item => {
//       try {
//         const summary = typeof item.summary === 'string' ? 
//           JSON.parse(item.summary) : item.summary;
//         if (summary.assets && summary.assets.length > 0) {
//           const asset = summary.assets[0];
//           return {
//             ticker: asset.ticker,
//             rating: asset.rating,
//             targetPrice: asset.target_price,
//             sentiment: asset.sentiment,
//             action: asset.action,
//             catalysts: asset.catalysts,
//             kpis: asset.kpis,
//             sources: asset.sources
//           };
//         }
//       } catch (e) {
//         console.error('Error parsing summary:', e);
//       }
//       return null;
//     }).filter(Boolean);

//     if (analysisData.length === 0) return null;

//     return (
//       <div className="bg-gray-800 rounded-lg p-4 mb-4">
//         <div 
//           className="flex justify-between items-center cursor-pointer mb-4"
//           onClick={() => setIsTableExpanded(!isTableExpanded)}
//         >
//           <h3 className="text-lg font-medium">Market Analysis Summary</h3>
//           <span className="text-gray-400">
//             {isTableExpanded ? '▼' : '▶'}
//           </span>
//         </div>

//         {isTableExpanded && (
//           <div className="overflow-x-auto">
//             <table className="w-full text-sm text-left text-gray-300">
//               <thead className="text-xs uppercase bg-gray-700">
//                 <tr>
//                   <th className="px-4 py-3">Ticker</th>
//                   <th className="px-4 py-3">Rating</th>
//                   <th className="px-4 py-3">Target Price</th>
//                   <th className="px-4 py-3">Sentiment</th>
//                   <th className="px-4 py-3">Action</th>
//                   <th className="px-4 py-3">Catalysts</th>
//                   <th className="px-4 py-3">KPIs</th>
//                   <th className="px-4 py-3">Sources</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {analysisData.map((item, index) => (
//                   <tr key={index} className="border-b border-gray-700 bg-gray-800/50">
//                     <td className="px-4 py-3">{item.ticker}</td>
//                     <td className="px-4 py-3 max-w-[200px] truncate">{item.rating}</td>
//                     <td className="px-4 py-3">{item.targetPrice}</td>
//                     <td className="px-4 py-3">
//                       <span className={`px-2 py-1 rounded text-xs ${
//                         item.sentiment === 'Bullish' ? 'bg-green-500/20 text-green-400' :
//                         item.sentiment === 'Bearish' ? 'bg-red-500/20 text-red-400' :
//                         'bg-gray-500/20 text-gray-400'
//                       }`}>
//                         {item.sentiment}
//                       </span>
//                     </td>
//                     <td className="px-4 py-3">{item.action}</td>
//                     <td className="px-4 py-3">
//                       <ul className="list-disc list-inside">
//                         {item.catalysts?.map((catalyst: string, i: number) => (
//                           <li key={i} className="truncate max-w-[200px]" title={catalyst}>
//                             {catalyst}
//                           </li>
//                         ))}
//                       </ul>
//                     </td>
//                     <td className="px-4 py-3">
//                       <ul className="list-disc list-inside">
//                         {item.kpis?.map((kpi: string, i: number) => (
//                           <li key={i} className="truncate max-w-[200px]" title={kpi}>
//                             {kpi}
//                           </li>
//                         ))}
//                       </ul>
//                     </td>
//                     <td className="px-4 py-3">
//                       <ul className="list-disc list-inside">
//                         {item.sources?.map((source: string, i: number) => (
//                           <li key={i} className="truncate max-w-[200px]" title={source}>
//                             {source}
//                           </li>
//                         ))}
//                       </ul>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>
//     );
//   };

//   return (
//     <div className="space-y-4">
//       {/* Add the summary table at the top */}
//       {renderSummaryTable()}

//       {/* Existing results display */}
//       {data.map((result, index) => (
//         <div key={index} className="bg-gray-800 rounded-lg p-4">
//           <div 
//             className="border-b border-gray-700 pb-3 cursor-pointer"
//             onClick={() => toggleExpand(index)}
//           >
//             <div className="flex justify-between items-center">
//               <h3 className="text-lg font-medium">{result.title}</h3>
//               <span className="text-gray-400">
//                 {expandedItems[index] ? '▼' : '▶'}
//               </span>
//             </div>
            
//             {/* Source URL and Timestamp */}
//             <div className="text-sm text-gray-400 mt-2">
//               <a 
//                 href={result.url} 
//                 target="_blank" 
//                 rel="noopener noreferrer" 
//                 className="hover:underline"
//                 onClick={(e) => e.stopPropagation()}
//               >
//                 {new URL(result.url).hostname}
//               </a>
//               <span className="mx-2">•</span>
//               <span>{new Date(result.timestamp).toLocaleString()}</span>
//             </div>
//           </div>

//           {/* Expanded Content */}
//           {expandedItems[index] && (
//             <div className="mt-4 space-y-4">
//               {/* Content Preview */}
//               <div className="bg-gray-700/50 p-4 rounded">
//                 <h4 className="font-medium mb-2">Content Preview</h4>
//                 <p className="text-sm text-gray-300 whitespace-pre-wrap">
//                   {result.content.substring(0, 300)}...
//                 </p>
//               </div>

//               {/* Summary if available */}
//               {result.summary && Object.keys(result.summary).length > 0 && (
//                 <div className="bg-gray-700/50 p-4 rounded">
//                   <h4 className="font-medium mb-2">Analysis Summary</h4>
//                   <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto">
//                     {JSON.stringify(result.summary, null, 2)}
//                   </pre>
//                 </div>
//               )}

//               {/* Metadata */}
//               <div className="text-xs text-gray-400">
//                 <span>Status: {result.status}</span>
//                 <span className="mx-2">•</span>
//                 <span>Method: {result.extraction_method}</span>
//                 {result.agent_id && (
//                   <>
//                     <span className="mx-2">•</span>
//                     <span>Agent: {result.agent_id}</span>
//                   </>
//                 )}
//               </div>
//             </div>
//           )}
//         </div>
//       ))}
//     </div>
//   );
// };

//TABLE
// import React, { useState } from 'react';
// import type { ResearchData } from '../../types/research';

// interface ResearchResultProps {
//   data: ResearchData[];  // Change to array type
// }

// export const ResearchResult: React.FC<ResearchResultProps> = ({ data }) => {
//   const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
//   const [isTableExpanded, setIsTableExpanded] = useState(true);

//   if (!Array.isArray(data)) {
//     return null;
//   }

//   const toggleExpand = (index: number) => {
//     setExpandedItems(prev => ({
//       ...prev,
//       [index]: !prev[index]
//     }));
//   };

//   // Function to render the summary table
//   const renderSummaryTable = () => {
//     const analysisData = data.map(item => {
//       try {
//         const summary = typeof item.summary === 'string' ? 
//           JSON.parse(item.summary) : item.summary;
//         if (summary.assets && summary.assets.length > 0) {
//           const asset = summary.assets[0];
//           return {
//             ticker: asset.ticker,
//             rating: asset.rating,
//             targetPrice: asset.target_price,
//             sentiment: asset.sentiment,
//             action: asset.action,
//           };
//         }
//       } catch (e) {
//         console.error('Error parsing summary:', e);
//       }
//       return null;
//     }).filter(Boolean);

//     if (analysisData.length === 0) return null;

//     return (
//       <div className="bg-gray-800 rounded-lg p-4 mb-4">
//         <div 
//           className="flex justify-between items-center cursor-pointer mb-4"
//           onClick={() => setIsTableExpanded(!isTableExpanded)}
//         >
//           <h3 className="text-lg font-medium">Market Analysis Summary</h3>
//           <span className="text-gray-400">
//             {isTableExpanded ? '▼' : '▶'}
//           </span>
//         </div>

//         {isTableExpanded && (
//           <div className="overflow-x-auto">
//             <table className="w-full text-sm text-left text-gray-300">
//               <thead className="text-xs uppercase bg-gray-700">
//                 <tr>
//                   <th className="px-4 py-3">Ticker</th>
//                   <th className="px-4 py-3">Rating</th>
//                   <th className="px-4 py-3">Target Price</th>
//                   <th className="px-4 py-3">Sentiment</th>
//                   <th className="px-4 py-3">Action</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {analysisData.map((item, index) => (
//                   <tr key={index} className="border-b border-gray-700 bg-gray-800/50">
//                     <td className="px-4 py-3">{item.ticker}</td>
//                     <td className="px-4 py-3">{item.rating}</td>
//                     <td className="px-4 py-3">{item.targetPrice}</td>
//                     <td className="px-4 py-3">
//                       <span className={`px-2 py-1 rounded text-xs ${
//                         item.sentiment === 'Bullish' ? 'bg-green-500/20 text-green-400' :
//                         item.sentiment === 'Bearish' ? 'bg-red-500/20 text-red-400' :
//                         'bg-gray-500/20 text-gray-400'
//                       }`}>
//                         {item.sentiment}
//                       </span>
//                     </td>
//                     <td className="px-4 py-3">{item.action}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>
//     );
//   };

//   return (
//     <div className="space-y-4">
//       {/* Add the summary table at the top */}
//       {renderSummaryTable()}

//       {/* Existing results display */}
//       {data.map((result, index) => (
//         <div key={index} className="bg-gray-800 rounded-lg p-4">
//           <div 
//             className="border-b border-gray-700 pb-3 cursor-pointer"
//             onClick={() => toggleExpand(index)}
//           >
//             <div className="flex justify-between items-center">
//               <h3 className="text-lg font-medium">{result.title}</h3>
//               <span className="text-gray-400">
//                 {expandedItems[index] ? '▼' : '▶'}
//               </span>
//             </div>
            
//             {/* Source URL and Timestamp */}
//             <div className="text-sm text-gray-400 mt-2">
//               <a 
//                 href={result.url} 
//                 target="_blank" 
//                 rel="noopener noreferrer" 
//                 className="hover:underline"
//                 onClick={(e) => e.stopPropagation()}
//               >
//                 {new URL(result.url).hostname}
//               </a>
//               <span className="mx-2">•</span>
//               <span>{new Date(result.timestamp).toLocaleString()}</span>
//             </div>
//           </div>

//           {/* Expanded Content */}
//           {expandedItems[index] && (
//             <div className="mt-4 space-y-4">
//               {/* Content Preview */}
//               <div className="bg-gray-700/50 p-4 rounded">
//                 <h4 className="font-medium mb-2">Content Preview</h4>
//                 <p className="text-sm text-gray-300 whitespace-pre-wrap">
//                   {result.content.substring(0, 300)}...
//                 </p>
//               </div>

//               {/* Summary if available */}
//               {result.summary && Object.keys(result.summary).length > 0 && (
//                 <div className="bg-gray-700/50 p-4 rounded">
//                   <h4 className="font-medium mb-2">Analysis Summary</h4>
//                   <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto">
//                     {JSON.stringify(result.summary, null, 2)}
//                   </pre>
//                 </div>
//               )}

//               {/* Metadata */}
//               <div className="text-xs text-gray-400">
//                 <span>Status: {result.status}</span>
//                 <span className="mx-2">•</span>
//                 <span>Method: {result.extraction_method}</span>
//                 {result.agent_id && (
//                   <>
//                     <span className="mx-2">•</span>
//                     <span>Agent: {result.agent_id}</span>
//                   </>
//                 )}
//               </div>
//             </div>
//           )}
//         </div>
//       ))}
//     </div>
//   );
// };

// {/* <Worked></Worked> */}

// import React, { useState } from 'react';
// import type { ResearchData } from '../../types/research';

// interface ResearchResultProps {
//   data: ResearchData[];  // Change to array type
// }

// export const ResearchResult: React.FC<ResearchResultProps> = ({ data }) => {
//   const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  
  

//   if (!Array.isArray(data)) {
//     return null;
//   }

//   const toggleExpand = (index: number) => {
//     setExpandedItems(prev => ({
//       ...prev,
//       [index]: !prev[index]
//     }));
//   };

//   return (
//     <div className="space-y-4">
//       {data.map((result, index) => (
//         <div key={index} className="bg-gray-800 rounded-lg p-4">
//           <div 
//             className="border-b border-gray-700 pb-3 cursor-pointer"
//             onClick={() => toggleExpand(index)}
//           >
//             <div className="flex justify-between items-center">
//               <h3 className="text-lg font-medium">{result.title}</h3>
//               <span className="text-gray-400">
//                 {expandedItems[index] ? '▼' : '▶'}
//               </span>
//             </div>
            
//             {/* Source URL and Timestamp */}
//             <div className="text-sm text-gray-400 mt-2">
//               <a 
//                 href={result.url} 
//                 target="_blank" 
//                 rel="noopener noreferrer" 
//                 className="hover:underline"
//                 onClick={(e) => e.stopPropagation()}
//               >
//                 {new URL(result.url).hostname}
//               </a>
//               <span className="mx-2">•</span>
//               <span>{new Date(result.timestamp).toLocaleString()}</span>
//             </div>
//           </div>

//           {/* Expanded Content */}
//           {expandedItems[index] && (
//             <div className="mt-4 space-y-4">
//               {/* Content Preview */}
//               <div className="bg-gray-700/50 p-4 rounded">
//                 <h4 className="font-medium mb-2">Content Preview</h4>
//                 <p className="text-sm text-gray-300 whitespace-pre-wrap">
//                   {result.content.substring(0, 300)}...
//                 </p>
//               </div>

//               {/* Summary if available */}
//               {result.summary && Object.keys(result.summary).length > 0 && (
//                 <div className="bg-gray-700/50 p-4 rounded">
//                   <h4 className="font-medium mb-2">Analysis Summary</h4>
//                   <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto">
//                     {JSON.stringify(result.summary, null, 2)}
//                   </pre>
//                 </div>
//               )}

//               {/* Metadata */}
//               <div className="text-xs text-gray-400">
//                 <span>Status: {result.status}</span>
//                 <span className="mx-2">•</span>
//                 <span>Method: {result.extraction_method}</span>
//                 {result.agent_id && (
//                   <>
//                     <span className="mx-2">•</span>
//                     <span>Agent: {result.agent_id}</span>
//                   </>
//                 )}
//               </div>
//             </div>
//           )}
//         </div>
//       ))}
//     </div>
//   );
// };

// import React, { useState } from 'react';
// import type { ResearchData } from '../../types/research';

// interface ResearchResultProps {
//   data: ResearchData[];  // Change to array type
// }

// export const ResearchResult: React.FC<ResearchResultProps> = ({ data }) => {
//   const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  

//   if (!Array.isArray(data)) {
//     return null;
//   }

//   const toggleExpand = (index: number) => {
//     setExpandedItems(prev => ({
//       ...prev,
//       [index]: !prev[index]
//     }));
//   };

//   return (
//     <div className="space-y-4">
//       {data.map((result, index) => (
//         <div key={index} className="bg-gray-800 rounded-lg p-4">
//           <div 
//             className="border-b border-gray-700 pb-3 cursor-pointer"
//             onClick={() => toggleExpand(index)}
//           >
//             <div className="flex justify-between items-center">
//               <h3 className="text-lg font-medium">{result.title}</h3>
//               <span className="text-gray-400">
//                 {expandedItems[index] ? '▼' : '▶'}
//               </span>
//             </div>
            
//             {/* Source URL and Timestamp */}
//             <div className="text-sm text-gray-400 mt-2">
//               <a 
//                 href={result.url} 
//                 target="_blank" 
//                 rel="noopener noreferrer" 
//                 className="hover:underline"
//                 onClick={(e) => e.stopPropagation()}
//               >
//                 {new URL(result.url).hostname}
//               </a>
//               <span className="mx-2">•</span>
//               <span>{new Date(result.timestamp).toLocaleString()}</span>
//             </div>
//           </div>

//           {/* Expanded Content */}
//           {expandedItems[index] && (
//             <div className="mt-4 space-y-4">
//               {/* Content Preview */}
//               <div className="bg-gray-700/50 p-4 rounded">
//                 <h4 className="font-medium mb-2">Content Preview</h4>
//                 <p className="text-sm text-gray-300 whitespace-pre-wrap">
//                   {result.content.substring(0, 300)}...
//                 </p>
//               </div>

//               {/* Summary if available */}
//               {result.summary && Object.keys(result.summary).length > 0 && (
//                 <div className="bg-gray-700/50 p-4 rounded">
//                   <h4 className="font-medium mb-2">Analysis Summary</h4>
//                   <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto">
//                     {JSON.stringify(result.summary, null, 2)}
//                   </pre>
//                 </div>
//               )}

//               {/* Metadata */}
//               <div className="text-xs text-gray-400">
//                 <span>Status: {result.status}</span>
//                 <span className="mx-2">•</span>
//                 <span>Method: {result.extraction_method}</span>
//                 {result.agent_id && (
//                   <>
//                     <span className="mx-2">•</span>
//                     <span>Agent: {result.agent_id}</span>
//                   </>
//                 )}
//               </div>
//             </div>
//           )}
//         </div>
//       ))}
//     </div>
//   );
// };

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