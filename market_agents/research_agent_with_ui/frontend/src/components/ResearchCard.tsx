import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ResearchData, SchemaInfo, SchemaField } from '../types/research';

interface ResearchCardProps {
  data: ResearchData[];
}

export const ResearchCard: React.FC<ResearchCardProps> = ({ data }) => {
  const [schema, setSchema] = useState<SchemaInfo | null>(null);
  const [expandedItems, setExpandedItems] = React.useState<Record<number, boolean>>({});

  // Fetch schema from backend
  useEffect(() => {
    const fetchSchema = async () => {
      try {
        const response = await fetch('/api/schema');
        const schemaData: SchemaInfo = await response.json();
        setSchema(schemaData);
      } catch (error) {
        console.error('Failed to fetch schema:', error);
        // Fallback to inferred schema
        const inferredSchema: SchemaInfo = {
          fields: inferColumnsFromData(data)
        };
        setSchema(inferredSchema);
      }
    };

    fetchSchema();
  }, [data]);

  // Infer columns from data if schema fetch fails
  const inferColumnsFromData = (data: ResearchData[]): SchemaField[] => {
    const columnSet = new Set<string>();
    data.forEach(item => {
      Object.keys(item).forEach(key => columnSet.add(key));
    });
    
    return Array.from(columnSet).map(name => ({
      name,
      type: 'string', // Default type
      required: false
    }));
  };

  // Get current columns from schema or infer them
  const columns = schema?.fields || inferColumnsFromData(data);

  // Render cell based on field type
  const renderCell = (value: any, field: SchemaField) => {
    if (value == null) return 'N/A';

    switch (field.type) {
      case 'array':
        return Array.isArray(value) ? (
          <ul className="list-disc pl-4">
            {value.map((item, i) => (
              <li key={i}>{renderValue(item)}</li>
            ))}
          </ul>
        ) : renderValue(value);
      
      case 'object':
        return (
          <div className="space-y-1">
            {Object.entries(value).map(([key, val]) => (
              <div key={key}>
                <span className="font-medium">{key}: </span>
                {renderValue(val)}
              </div>
            ))}
          </div>
        );
      
      case 'url':
        return (
          <a 
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
            onClick={e => e.stopPropagation()}
          >
            {new URL(value).hostname}
          </a>
        );
      
      default:
        return renderValue(value);
    }
  };

  // Generic value renderer
  const renderValue = (value: any): React.ReactNode => {
    if (value == null) return 'N/A';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <div className="space-y-4">
      {/* Dynamic Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-md p-4">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              {columns.map(field => (
                <th key={field.name} className="px-4 py-3 text-left">
                  <div className="flex flex-col">
                    <span>{field.name}</span>
                    {field.description && (
                      <span className="text-xs text-gray-500">{field.description}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr 
                key={index} 
                className="border-b hover:bg-gray-50 cursor-pointer"
                onClick={() => setExpandedItems(prev => ({
                  ...prev,
                  [index]: !prev[index]
                }))}
              >
                {columns.map(field => (
                  <td key={field.name} className="px-4 py-3">
                    {renderCell(item[field.name], field)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detailed View */}
      {data.map((item, index) => (
        <div key={index} className="bg-white rounded-lg shadow-md p-6">
          <div 
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setExpandedItems(prev => ({
              ...prev,
              [index]: !prev[index]
            }))}
          >
            <h2 className="text-xl font-semibold">
              {item.title || `Research Result ${index + 1}`}
            </h2>
            {expandedItems[index] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>

          {expandedItems[index] && (
            <div className="mt-4 space-y-4">
              {columns.map(field => (
                <div key={field.name} className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">{field.name}</h3>
                  {renderCell(item[field.name], field)}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};