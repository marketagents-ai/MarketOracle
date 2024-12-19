// chat-frontend/src/components/ResearchPanel.tsx
import React from 'react';
import { ResearchResult } from '../types';

interface ResearchPanelProps {
  result?: ResearchResult | null;
}

export const ResearchPanel: React.FC<ResearchPanelProps> = ({ result }) => {
  if (!result) return null;

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Research Results</h2>
      <div className="space-y-2">
        <p><strong>Query:</strong> {result.query}</p>
        <p><strong>Created:</strong> {new Date(result.created_at).toLocaleString()}</p>
        <div className="mt-4">
          <h3 className="text-lg font-semibold">Results</h3>
          <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto">
            {JSON.stringify(result.results, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};