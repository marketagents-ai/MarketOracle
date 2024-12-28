import type { LucideIcon } from 'lucide-react';

export interface SystemTool {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  type: 'executable' | 'typed';
  category: 'analysis' | 'risk' | 'data' | 'ai' | 'automation';
}

export interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required?: boolean;
}

export interface CustomTool {
  id: string;
  name: string;
  description: string;
  schema: {
    type: 'object';
    properties: Record<string, {
      type: SchemaField['type'];
      required?: boolean;
    }>;
  };
};