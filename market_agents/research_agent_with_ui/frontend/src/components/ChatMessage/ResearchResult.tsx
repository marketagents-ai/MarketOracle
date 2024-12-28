import React from 'react';
import type { ResearchData } from '../../types/research';

interface ResearchResultProps {
  data: ResearchData;
}

export const ResearchResult: React.FC<ResearchResultProps> = ({ data }) => {
  return (
    <div className="bg-gray-700 text-white rounded-lg p-4 mb-4 max-w-[80%]">
      <h3 className="font-medium mb-2">{data.title.split('#').pop()}</h3>
      
      <div className="mb-4">
        <h4 className="font-medium mb-2">Summary</h4>
        <p>{data.summary.summary}</p>
        
        <div className="mt-2">
          <h5 className="font-medium mb-1">Key Points</h5>
          <ul className="list-disc list-inside">
            {data.summary.key_points.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-gray-600 p-3 rounded">
          <h4 className="font-medium mb-2">Market Impact</h4>
          <div className="space-y-1">
            <p><span className="font-medium">Short Term:</span> {data.summary.market_impact.short_term}</p>
            <p><span className="font-medium">Medium Term:</span> {data.summary.market_impact.medium_term}</p>
            <p><span className="font-medium">Long Term:</span> {data.summary.market_impact.long_term}</p>
          </div>
        </div>

        <div className="bg-gray-600 p-3 rounded">
          <h4 className="font-medium mb-2">Risk Assessment</h4>
          <p><span className="font-medium">Risk Level:</span> {data.summary.risk_assessment.risk_level}</p>
          <p><span className="font-medium">Risk/Reward:</span> {data.summary.risk_assessment.risk_reward_ratio}</p>
        </div>
      </div>

      <div className="mt-3 text-sm text-gray-400">
        <a 
          href={data.url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:underline"
        >
          View Source
        </a>
        <span className="mx-2">•</span>
        <span>{new Date(data.timestamp).toLocaleString()}</span>
      </div>
    </div>
  );
};