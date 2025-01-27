from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
import sys
from pathlib import Path
from datetime import datetime
import importlib

# Setup path for imports
ROOT_DIR = Path(__file__).parent.parent.parent
sys.path.append(str(ROOT_DIR))

from research_agent_enhanced import WebSearchAgent, WebSearchConfig
from utils import load_config, logger

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://0.0.0.0:5173", "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

class ResearchRequest(BaseModel):
    query: str
    urls: Optional[List[str]] = None

class SchemaField(BaseModel):
    name: str
    type: str
    description: Optional[str] = None
    required: bool = False
    nested: Optional[List['SchemaField']] = None

class SchemaInfo(BaseModel):
    fields: List[SchemaField]

class ResearchResponse(BaseModel):
    results: List[Dict[str, Any]]
    metrics: Dict[str, Any]
    schema: Optional[SchemaInfo] = None

def convert_pydantic_schema_to_frontend_schema(schema_data: Dict[str, Any]) -> Dict[str, Any]:
    """Convert Pydantic schema to frontend-friendly format"""
    fields = []
    
    for prop_name, prop_data in schema_data.get("properties", {}).items():
        field = {
            "name": prop_name,
            "type": prop_data.get("type", "string"),
            "description": prop_data.get("description", ""),
            "required": prop_name in schema_data.get("required", [])
        }
        
        # Handle nested objects
        if prop_data.get("type") == "object" and "properties" in prop_data:
            field["nested"] = convert_pydantic_schema_to_frontend_schema(prop_data)["fields"]
        
        # Handle arrays
        elif prop_data.get("type") == "array":
            field["type"] = "array"
            if "items" in prop_data:
                if prop_data["items"].get("type") == "object":
                    field["nested"] = convert_pydantic_schema_to_frontend_schema(
                        {"properties": prop_data["items"].get("properties", {})}
                    )["fields"]
        
        fields.append(field)
    
    return {"fields": fields}

@app.get("/", response_class=HTMLResponse)
async def home():
    return """
    <html>
        <head>
            <title>Research API</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    max-width: 800px; 
                    margin: 40px auto; 
                    padding: 20px;
                    line-height: 1.6;
                }
                code {
                    background: #f4f4f4;
                    padding: 2px 5px;
                    border-radius: 3px;
                }
                pre {
                    background: #f4f4f4;
                    padding: 15px;
                    border-radius: 5px;
                    overflow-x: auto;
                }
            </style>
        </head>
        <body>
            <h1>Research API Documentation</h1>
            
            <h2>Available Endpoints:</h2>
            
            <h3>1. Research Query</h3>
            <p><code>POST /api/research</code></p>
            <p>Submit a research query to analyze web content.</p>
            <p>Request body example:</p>
            <pre>
{
    "query": "Your research query here",
    "urls": ["optional_url1", "optional_url2"]  // Optional
}
            </pre>
            
            <h3>2. Health Check</h3>
            <p><code>GET /api/test</code></p>
            <p>Check if the API is running.</p>
            
            <h2>Usage Example:</h2>
            <pre>
curl -X POST "http://localhost:5001/api/research" \\
     -H "Content-Type: application/json" \\
     -d '{"query": "Latest developments in AI technology"}'
            </pre>
        </body>
    </html>
    """

@app.get("/api/test")
async def test():
    return {"status": "ok", "message": "Backend is running"}

@app.get("/api/schema")
async def get_schema():
    """Return the schema based on the configured research schema"""
    try:
        # Load config to get schema name
        config_data, _ = load_config()
        config = WebSearchConfig(**config_data)
        
        # Get schema class from config
        schema_name = config.llm_configs["content_analysis"]["schema_config"]["schema_name"]
        
        # Import the schema dynamically
        schemas_module = importlib.import_module('market_agents.research_agents.research_schemas')
        schema_class = getattr(schemas_module, schema_name)
        
        # Get Pydantic schema (using model_json_schema instead of model_schema)
        pydantic_schema = schema_class.model_json_schema()
        
        # Convert to frontend format
        frontend_schema = convert_pydantic_schema_to_frontend_schema(pydantic_schema)
        
        return frontend_schema
    except Exception as e:
        logger.error(f"Schema generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/research", response_model=ResearchResponse)
async def research(request: ResearchRequest):
    logger.info(f"Received research request: {request.query}")
    try:
        config_data, prompts = load_config()
        config_data["query"] = request.query
        if request.urls:
            config_data["urls"] = request.urls
            
        config = WebSearchConfig(**config_data)
        agent = WebSearchAgent(config, prompts)
        await agent.process_search_query(request.query)
        
        # Generate output filename
        output_file = f"outputs/web_search/results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        # Save results and get metrics
        try:
            save_result = agent.save_results(output_file)
        except Exception as save_error:
            logger.error(f"Error saving results: {str(save_error)}")
            save_result = None
        
        # Format results with null checks
        formatted_results = []
        if hasattr(agent, 'results') and agent.results:
            for result in agent.results:
                if result and hasattr(result, 'status'):
                    try:
                        formatted_results.append({
                            "url": getattr(result, 'url', ''),
                            "title": getattr(result, 'title', 'No title'),
                            "content": getattr(result, 'content', ''),
                            "timestamp": result.timestamp.isoformat() if hasattr(result, 'timestamp') and result.timestamp else datetime.now().isoformat(),
                            "status": getattr(result, 'status', 'unknown'),
                            "summary": getattr(result, 'summary', {}),
                            "agent_id": getattr(result, 'agent_id', None),
                            "extraction_method": getattr(result, 'extraction_method', None)
                        })
                    except Exception as e:
                        logger.error(f"Error formatting result: {str(e)}")
                        continue
        
        # Get schema
        schema = await get_schema()
        
        # Return both results and metrics with schema
        response_data = {
            "results": formatted_results,
            "metrics": {
                "total_articles": len(agent.results) if hasattr(agent, 'results') and agent.results else 0,
                "successful_extractions": len(formatted_results),
                "failed_extractions": (len(agent.results) if hasattr(agent, 'results') and agent.results else 0) - len(formatted_results),
                "database_status": "success" if formatted_results else "error",
                "output_file": output_file if formatted_results else None
            },
            "schema": schema
        }
        
        logger.debug(f"Response data: {response_data}")
        return response_data
        
    except Exception as e:
        logger.error(f"Research error: {str(e)}")
        return {
            "results": [],
            "metrics": {
                "total_articles": 0,
                "successful_extractions": 0,
                "failed_extractions": 0,
                "database_status": "error",
                "output_file": None,
                "error": str(e)
            },
            "schema": None
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)