import { useState, useCallback } from 'react';
import type { CustomTool } from '../types/tools';

export const useCustomTools = () => {
  const [tools, setTools] = useState<CustomTool[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);

  const startBuilding = useCallback(() => {
    setIsBuilding(true);
  }, []);

  const cancelBuilding = useCallback(() => {
    setIsBuilding(false);
  }, []);

  const saveTool = useCallback((tool: CustomTool) => {
    setTools(prev => [...prev, tool]);
    setIsBuilding(false);
  }, []);

  return {
    tools,
    isBuilding,
    startBuilding,
    cancelBuilding,
    saveTool,
  };
};