import React from 'react';
import { ResearchResult } from '../types';

interface ResearchResultsProps {
  result: ResearchResult;
}

export const ResearchResults: React.FC<ResearchResultsProps> = ({ result }) => {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Research Results</h2>
      <div className="text-sm text-gray-500">Query: {result.query}</div>
      <div className="text-sm text-gray-500">Time: {new Date(result.timestamp).toLocaleString()}</div>
      
      <div className="space-y-6">
        {result.results.map((searchResult, index) => (
          <div key={index} className="border p-4 rounded-lg">
            <h3 className="font-bold text-lg">
              <a href={searchResult.url} target="_blank" rel="noopener noreferrer" 
                 className="text-blue-600 hover:text-blue-800">
                {searchResult.title}
              </a>
            </h3>
            
            {searchResult.summary && (
              <div className="mt-2">
                <div className="font-medium">Summary:</div>
                <p className="text-gray-700">{searchResult.summary.summary}</p>
                
                {searchResult.summary.key_points && (
                  <div className="mt-2">
                    <div className="font-medium">Key Points:</div>
                    <ul className="list-disc pl-5">
                      {searchResult.summary.key_points.map((point, idx) => (
                        <li key={idx}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {searchResult.summary.sentiment && (
                  <div className="mt-2">
                    <div className="font-medium">Sentiment:</div>
                    <p>{searchResult.summary.sentiment}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};