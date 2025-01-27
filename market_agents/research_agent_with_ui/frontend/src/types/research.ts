// research.ts
export interface ResearchData {
  url?: string;
  title?: string;
  content?: string;
  timestamp?: string;
  status?: string;
  summary?: any;
  agent_id?: string;
  extraction_method?: string;
}

export interface SchemaField {
  name: string;
  type: string;
  description?: string;
  required: boolean;
  nested?: SchemaField[];
}

export interface SchemaInfo {
  fields: SchemaField[];
}

export interface ResearchResponse {
  results: ResearchData[];
  metrics: {
    total_articles: number;
    successful_extractions: number;
    failed_extractions: number;
    database_status: string;
    output_file: string | null;
    error?: string; 
  };
  schema?: SchemaInfo;
}