import React from 'react';
import { ResearchResult } from '../types';

interface ResearchResultsProps {
  result?: ResearchResult | null;
}

export const ResearchResults: React.FC<ResearchResultsProps> = ({ result }) => {
  if (!result) return null;

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Research Results for: {result.query}</h2>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Summaries</h3>
        {result.summaries.map((summary, index) => (
          <div key={index} className="border p-4 rounded">
            <div className="font-medium">{summary.url}</div>
            <div className="mt-2">{summary.summary}</div>
            <div className="mt-2 text-sm text-gray-600">
              Sentiment: {summary.sentiment}
            </div>
            <div className="mt-2">
              <div className="font-medium">Key Points:</div>
              <ul className="list-disc pl-5">
                {summary.key_points.map((point, idx) => (
                  <li key={idx}>{point}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {result.analysis && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Analysis</h3>
          <div className="border p-4 rounded">
            <div>
              <div className="font-medium">Market Sentiment:</div>
              <div>{result.analysis.market_sentiment}</div>
            </div>
            <div className="mt-4">
              <div className="font-medium">Key Trends:</div>
              <ul className="list-disc pl-5">
                {result.analysis.key_trends.map((trend, index) => (
                  <li key={index}>{trend}</li>
                ))}
              </ul>
            </div>
            <div className="mt-4">
              <div className="font-medium">Recommendations:</div>
              <ul className="list-disc pl-5">
                {result.analysis.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};