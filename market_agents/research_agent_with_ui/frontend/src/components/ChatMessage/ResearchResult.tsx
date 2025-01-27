import React, { useState } from 'react';
import { Download } from 'lucide-react';
import type { ResearchData, SchemaInfo, SchemaField } from '../../types/research';

interface ResearchResultProps {
  data: ResearchData[];
  schema?: SchemaInfo;
  metrics?: {
    total_articles: number;
    successful_extractions: number;
    failed_extractions: number;
    database_status: string;
    output_file: string | null;
  };
}

export const ResearchResult: React.FC<ResearchResultProps> = ({ data, schema, metrics }) => {
  const [isTableExpanded, setIsTableExpanded] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});

  // If no schema is provided, we can fallback to an inferred schema if needed.
  if (!schema || !schema.fields) {
    return (
      <div>
        <p>No schema detected. Rendering raw JSON:</p>
        <pre className="text-sm bg-gray-800 p-4 rounded">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  }

  // Merges top-level item fields with summary fields based on the schema keys
  const parseDataWithSchema = (item: ResearchData) => {
    // If summary is a string, parse it; if it’s an object, use directly
    const summary =
      typeof item.summary === 'string' ? JSON.parse(item.summary || '{}') : item.summary || {};

    const merged: Record<string, any> = {};
    schema.fields.forEach((field) => {
      // Attempt to read from top-level or inside summary
      merged[field.name] = item[field.name] ?? summary[field.name] ?? null;
    });
    return merged;
  };

  // Prepare array of "merged" data objects
  const analysisData = data.map(parseDataWithSchema);

  // Convert array to CSV
  const convertToCSV = (analysisRows: Record<string, any>[]) => {
    const headers = schema.fields.map((f) => f.name);
    const rows = analysisRows.map((row) =>
      headers.map((h) => {
        const cell = row[h];
        return Array.isArray(cell) ? cell.join('|') : cell || '';
      })
    );
    const csvLines = [
      headers.join(','),
      ...rows.map((r) => r.map((val) => `"${val}"`).join(','))
    ];
    return csvLines.join('\n');
  };

  // Download CSV
  const downloadCSV = () => {
    const csvString = convertToCSV(analysisData);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `research_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render a value based on the schema field
  const renderCell = (value: any, field: SchemaField) => {
    if (value == null) return 'N/A';

    switch (field.type) {
      case 'array':
        // If it’s an array, show bullet points
        return Array.isArray(value) ? (
          <ul className="list-disc list-inside">
            {value.map((item: any, i: number) => (
              <li key={i} className="truncate max-w-[200px]" title={String(item)}>
                {String(item)}
              </li>
            ))}
          </ul>
        ) : (
          String(value)
        );

      case 'object':
        return (
          <pre className="text-sm whitespace-pre-wrap">
            {JSON.stringify(value, null, 2)}
          </pre>
        );

      default:
        // String, number, etc.
        return String(value);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Section (Optional) */}
      {metrics && (
        <div className="mb-4 p-4 bg-gray-800 rounded">
          <h2 className="font-semibold text-lg mb-2">Metrics</h2>
          <ul className="list-disc list-inside">
            <li>Total Articles: {metrics.total_articles}</li>
            <li>Successful Extractions: {metrics.successful_extractions}</li>
            <li>Failed Extractions: {metrics.failed_extractions}</li>
            <li>Database Status: {metrics.database_status}</li>
            <li>Output File: {metrics.output_file || 'N/A'}</li>
          </ul>
        </div>
      )}

      {/* Summary Table */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div onClick={() => setIsTableExpanded(!isTableExpanded)} className="cursor-pointer">
            <h3 className="text-lg font-medium">Research Summary</h3>
            <span className="text-gray-400 text-sm">
              {isTableExpanded ? 'Collapse ▲' : 'Expand ▼'}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              downloadCSV();
            }}
            className="flex items-center gap-2 px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>

        {isTableExpanded && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs uppercase bg-gray-700">
                <tr>
                  {schema.fields.map((field) => (
                    <th key={field.name} className="px-4 py-3 whitespace-nowrap">
                      {field.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analysisData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="border-b border-gray-700 bg-gray-700/40 hover:bg-gray-700/60 cursor-pointer"
                    onClick={() =>
                      setExpandedItems((prev) => ({
                        ...prev,
                        [rowIndex]: !prev[rowIndex]
                      }))
                    }
                  >
                    {schema.fields.map((field) => (
                      <td key={field.name} className="px-4 py-3 whitespace-nowrap">
                        {renderCell(row[field.name], field)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed Item-by-item (Collapsible) */}
      <div className="bg-gray-800 rounded-lg p-4">
        {data.map((item, index) => {
          const itemTitle =
            typeof item.title === 'string' && item.title.trim().length
              ? item.title
              : item.url || `Result ${index + 1}`;

          return (
            <div key={index} className="mb-4 bg-gray-700 p-4 rounded">
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() =>
                  setExpandedItems((prev) => ({
                    ...prev,
                    [index]: !prev[index]
                  }))
                }
              >
                <h4 className="text-base font-medium">{itemTitle}</h4>
                <span className="text-gray-400">
                  {expandedItems[index] ? '▲' : '▼'}
                </span>
              </div>

              {expandedItems[index] && (
                <pre className="mt-2 text-sm whitespace-pre-wrap bg-gray-800 p-2 rounded">
                  {JSON.stringify(item, null, 2)}
                </pre>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};