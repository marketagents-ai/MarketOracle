import { useState, useEffect } from 'react';
import type { CustomTool } from '../types/tools';

export const useCustomTools = () => {
  const [tools, setTools] = useState<Tool[]>(() => {
    const savedTools = localStorage.getItem('customTools');
    return savedTools ? JSON.parse(savedTools) : [];
  });
  const [isBuilding, setIsBuilding] = useState(false);

  const startBuilding = () => setIsBuilding(true);
  const cancelBuilding = () => setIsBuilding(false);

  const saveTool = (tool: Tool) => {
    setTools(prev => [...prev, tool]);
    setIsBuilding(false);
    localStorage.setItem('customTools', JSON.stringify([...tools, tool]));
  };

  const deleteTool = async (toolName: string) => {
    try {
      // Delete from backend
      const response = await fetch('http://localhost:8000/api/tools/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: toolName })
      });

      if (!response.ok) {
        throw new Error('Failed to delete tool');
      }

      // Update local state
      const updatedTools = tools.filter(tool => tool.name !== toolName);
      setTools(updatedTools);
      
      // Update localStorage
      localStorage.setItem('customTools', JSON.stringify(updatedTools));
    } catch (error) {
      console.error('Error deleting tool:', error);
    }
  };

  return {
    tools,
    isBuilding,
    startBuilding,
    cancelBuilding,
    saveTool,
    deleteTool,
  };
};