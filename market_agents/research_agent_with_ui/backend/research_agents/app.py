from fastapi import FastAPI, HTTPException, Form, File, UploadFile  # Add Form, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi.responses import HTMLResponse
from openai import AsyncOpenAI
import sys
from pathlib import Path
from openai import OpenAI
import os
from dotenv import load_dotenv
import pandas as pd
import json
import openai
from io import StringIO
import io

load_dotenv()

# Setup path for imports
ROOT_DIR = Path(__file__).parent.parent.parent
sys.path.append(str(ROOT_DIR))

from research_agent_enhanced import WebSearchAgent, WebSearchConfig
from utils import load_config, logger

# Initialize FastAPI with metadata

client = AsyncOpenAI(
    api_key=os.getenv('OPENAI_KEY')
)


app = FastAPI(
    title="Research API",
    description="API for web research and analysis",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
class ResearchRequest(BaseModel):
    query: str
    urls: Optional[List[str]] = None

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
curl -X POST "http://localhost:5000/api/research" \\
     -H "Content-Type: application/json" \\
     -d '{"query": "Latest developments in AI technology"}'
            </pre>

            <p>For interactive API documentation, visit: <a href="/docs">/docs</a></p>
        </body>
    </html>
    """

@app.get("/api/test")
async def test():
    """Health check endpoint"""
    return {"status": "ok", "message": "Backend is running"}


class Tool(BaseModel):
    id: str
    name: str
    description: str

@app.post("/api/custom")
async def custom_chat(
    message: str = Form(...),
    file: Optional[UploadFile] = File(None),
    tools: Optional[str] = Form(None)
):
    try:
        logger.info(f"Received custom chat request - Message: {message}")
        
        # Parse tools if provided
        enabled_tools = []
        if tools:
            try:
                enabled_tools = json.loads(tools)
                logger.info(f"Enabled tools: {enabled_tools}")
            except json.JSONDecodeError:
                logger.warning("Failed to parse tools JSON")

        # Process file if provided
        file_content = None
        if file:
            try:
                content = await file.read()
                file_content = content.decode('utf-8')
            except Exception as e:
                logger.error(f"Error reading file: {e}")
                raise HTTPException(status_code=400, detail="Error reading file")

        # Create the system prompt
        system_prompt = "You are an expert financial analyst and market researcher."
        if enabled_tools:
            tool_descriptions = "\n".join(f"- {tool['name']}: {tool['description']}" for tool in enabled_tools)
            system_prompt += f"\nEnabled tools:\n{tool_descriptions}"

        try:
            # Call OpenAI API
            response = await client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message if not file_content else f"{message}\n\nFile content:\n{file_content}"}
                ],
                temperature=0.7,
                max_tokens=1000
            )

            return {
                "content": response.choices[0].message.content,
                "timestamp": datetime.now().isoformat(),
                "file_info": {
                    "filename": file.filename,
                    "size": len(file_content) if file_content else 0
                } if file else None
            }

        except Exception as e:
            logger.error(f"OpenAI API error: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to process request")

    except Exception as e:
        logger.error(f"Custom chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
# @app.post("/api/custom")
# async def custom_chat(
#     message: Optional[str] = Form(None),
#     file: Optional[UploadFile] = File(None)
# ):
#     try:
#         logger.info(f"Received message: {message}, file: {file.filename if file else None}")
        
#         if not message and not file:
#             raise HTTPException(
#                 status_code=400, 
#                 detail="Either message or file is required for analysis"
#             )

#         if file:
#             try:
#                 content = await file.read()
#                 logger.info(f"File content type: {file.content_type}")
#                 logger.info(f"File size: {len(content)} bytes")
                
#                 data = None
#                 if file.filename.endswith('.csv'):
#                     try:
#                         df = pd.read_csv(io.StringIO(content.decode('utf-8')))
#                     except UnicodeDecodeError:
#                         df = pd.read_csv(io.StringIO(content.decode('latin-1')))
#                     data = df.head(10).to_dict('records')
#                     file_info = {
#                         "filename": file.filename,
#                         "total_records": len(df),
#                         "columns": df.columns.tolist(),
#                         "preview_records": 10
#                     }
#                 elif file.filename.endswith('.json'):
#                     json_data = json.loads(content.decode('utf-8'))
#                     if isinstance(json_data, list):
#                         data = json_data[:10]
#                         file_info = {
#                             "filename": file.filename,
#                             "total_records": len(json_data),
#                             "preview_records": 10
#                         }
#                     else:
#                         data = [json_data]
#                         file_info = {
#                             "filename": file.filename,
#                             "total_records": 1,
#                             "preview_records": 1
#                         }
#                 else:
#                     raise HTTPException(
#                         status_code=400, 
#                         detail="Currently only CSV and JSON files are supported"
#                     )

#                 system_prompt = """You are a data analysis expert. Analyze the following data and provide insights.
#                 Focus on:
#                 1. Data structure and content overview
#                 2. Key patterns or trends
#                 3. Notable observations
#                 4. Potential areas for deeper analysis
#                 Be specific and reference actual data points from the preview."""

#                 user_prompt = f"""
#                 Analyzing file: {file.filename}
#                 Total records: {file_info['total_records']}
                
#                 Preview of data:
#                 {json.dumps(data, indent=2)}
                
#                 User query: {message if message else 'Provide a general analysis of this data.'}
#                 """

#                 response = await client.chat.completions.create(
#                     model="gpt-4",
#                     messages=[
#                         {"role": "system", "content": system_prompt},
#                         {"role": "user", "content": user_prompt}
#                     ],
#                     temperature=0.7,
#                     max_tokens=2000
#                 )

#                 return {
#                     "content": response.choices[0].message.content,
#                     "file_info": file_info,
#                     "status": "success"
#                 }

#             except json.JSONDecodeError as e:
#                 logger.error(f"JSON parsing error: {str(e)}", exc_info=True)
#                 raise HTTPException(
#                     status_code=400, 
#                     detail="Invalid JSON file format"
#                 )
#             except pd.errors.EmptyDataError:
#                 raise HTTPException(
#                     status_code=400, 
#                     detail="The CSV file is empty"
#                 )
#             except Exception as e:
#                 logger.error(f"File parsing error: {str(e)}", exc_info=True)
#                 raise HTTPException(
#                     status_code=400, 
#                     detail=f"Error parsing file: {str(e)}"
#                 )

#         # Handle text-only queries
#         system_prompt = """You are an expert financial analyst. 
#         Provide detailed, actionable insights based on the user's query."""
        
#         response = await client.chat.completions.create(
#             model="gpt-4",
#             messages=[
#                 {"role": "system", "content": system_prompt},
#                 {"role": "user", "content": message}
#             ],
#             temperature=0.7,
#             max_tokens=1500
#         )

#         return {
#             "content": response.choices[0].message.content,
#             "status": "success"
#         }

#     except Exception as e:
#         logger.error(f"Custom chat error: {str(e)}", exc_info=True)
#         raise HTTPException(
#             status_code=500, 
#             detail=f"An error occurred while processing your request: {str(e)}"
#         )
    
def get_tools_path():
    """Get the absolute path to the custom_tools.json file and ensure the directory exists"""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    storage_dir = os.path.join(
        os.path.dirname(os.path.dirname(current_dir)),  # Go up two levels
        'storage'
    )
    # Create the storage directory if it doesn't exist
    os.makedirs(storage_dir, exist_ok=True)
    
    tools_path = os.path.join(storage_dir, 'custom_tools.json')
    
    # Create an empty tools file if it doesn't exist
    if not os.path.exists(tools_path):
        with open(tools_path, 'w', encoding='utf-8') as f:
            json.dump({}, f, indent=2, ensure_ascii=False)
    
    return tools_path
@app.post("/api/save-tool")
async def save_tool(tool_data: dict):
    try:
        # Path to custom_tools.json
        file_path = "storage/custom_tools.json"
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        # Read existing tools
        existing_tools = {}
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                existing_tools = json.load(f)
        
        # Merge new tool with existing tools
        existing_tools.update(tool_data)
        
        # Save updated tools back to file
        with open(file_path, 'w') as f:
            json.dump(existing_tools, f, indent=2)
            
        return {"status": "success", "message": "Tool saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

class DeleteToolRequest(BaseModel):
    toolName: str

@app.delete("/api/tools/delete")
async def delete_tool(request: DeleteToolRequest):
    try:
        file_path = "storage/custom_tools.json"
        with open(file_path, 'r') as f:
            tools = json.load(f)
            
        if request.toolName in tools:
            del tools[request.toolName]
            
            with open(file_path, 'w') as f:
                json.dump(tools, f, indent=2)
            
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@app.post("/api/delete-tool")
async def delete_tool(request: DeleteToolRequest):
    try:
        file_path = Path("storage/custom_tools.json")
        
        if file_path.exists():
            # Read existing tools
            with open(file_path, 'r', encoding='utf-8') as f:
                tools = json.load(f)
            
            # Remove the tool if it exists
            if request.toolName in tools:
                del tools[request.toolName]
                
                # Write updated tools back to file
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(tools, f, indent=2, ensure_ascii=False)
                
        return {"status": "success", "message": "Tool deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    


@app.post("/api/save-tools")
async def save_tools(tools: dict):
    try:
        # Use absolute path to ensure correct file location
        base_dir = Path(__file__).resolve().parent.parent
        file_path = base_dir / "storage" / "custom_tools.json"
        
        # Create directory if it doesn't exist
        os.makedirs(file_path.parent, exist_ok=True)
        
        print(f"Saving tools to: {file_path}")  # Debug print
        print(f"Tools data: {json.dumps(tools, indent=2)}")  # Debug print
        
        # Write tools to file
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(tools, f, indent=2, ensure_ascii=False)
            
        return {"status": "success", "message": "Tools saved successfully"}
    except Exception as e:
        print(f"Error saving tools: {str(e)}")  # Debug print
        raise HTTPException(status_code=500, detail=str(e))
    



@app.post("/api/tools")
async def save_tools(tools: dict):
    try:
        file_path = Path("storage/custom_tools.json")
        file_path.parent.mkdir(exist_ok=True)
        
        # Read existing tools if file exists
        existing_tools = {}
        if file_path.exists():
            with open(file_path, 'r') as f:
                existing_tools = json.load(f)
        
        # Merge new tools with existing ones
        existing_tools.update(tools)
        
        # Save all tools back to file
        with open(file_path, 'w') as f:
            json.dump(existing_tools, f, indent=2)
            
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/tools/{tool_id}/toggle")
async def toggle_tool(tool_id: str, enabled: bool):
    try:
        tools_path = get_tools_path()
        if os.path.exists(tools_path):
            with open(tools_path, 'r', encoding='utf-8') as f:
                tools = json.load(f)
            
            if tool_id in tools:
                tools[tool_id]['enabled'] = enabled
                with open(tools_path, 'w', encoding='utf-8') as f:
                    json.dump(tools, f, indent=2, ensure_ascii=False)
                return {"status": "success"}
        
        raise HTTPException(status_code=404, detail="Tool not found")
    except Exception as e:
        logger.error(f"Error toggling tool: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/api/research")
async def research(request: ResearchRequest):
    try:
        config_data, prompts = load_config()
        config = WebSearchConfig(**config_data)
        agent = WebSearchAgent(config, prompts)
        
        # Log the incoming request
        logger.info(f"Processing research query: {request.query}")
        
        await agent.process_search_query(request.query)
        
        # Log the raw results
        logger.info(f"Raw results: {agent.results}")
        
        # Convert Pydantic models to dict for JSON serialization
        formatted_results = [
            result.model_dump(exclude_none=True) 
            for result in agent.results 
            if result is not None
        ]
        
        return formatted_results

    except Exception as e:
        logger.error(f"Research error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
# @app.post("/api/research")
# async def research(request: ResearchRequest):
#     try:
#         config_data, prompts = load_config()
#         config = WebSearchConfig(**config_data)
#         agent = WebSearchAgent(config, prompts)
        
#         # Log the incoming request
#         logger.info(f"Processing research query: {request.query}")
        
#         await agent.process_search_query(request.query)
        
#         # Log the raw results
#         logger.info(f"Raw results: {agent.results}")
        
#         formatted_results = []
#         for result in agent.results:
#             if result:
#                 try:
#                     formatted_result = {
#                         "url": str(result.url),
#                         "title": str(result.title),
#                         "content": str(result.content),
#                         "timestamp": datetime.now().isoformat(),
#                         "status": "success",
#                         "summary": {
#                             "summary": str(result.summary.get("summary", "")),
#                             "key_points": result.summary.get("key_points", []),
#                             "market_impact": {
#                                 "short_term": "",
#                                 "medium_term": "",
#                                 "long_term": ""
#                             },
#                             "trading_implications": {
#                                 "entry_points": [],
#                                 "exit_targets": [],
#                                 "stop_loss_levels": [],
#                                 "position_sizing": ""
#                             },
#                             "technical_analysis": {
#                                 "trend_direction": "",
#                                 "support_levels": [],
#                                 "resistance_levels": [],
#                                 "indicators": {}
#                             },
#                             "sentiment_analysis": {
#                                 "overall_sentiment": "",
#                                 "sentiment_score": "",
#                                 "social_metrics": {
#                                     "social_volume": "",
#                                     "sentiment_trend": ""
#                                 },
#                                 "market_confidence": ""
#                             },
#                             "risk_assessment": {
#                                 "risk_level": "",
#                                 "risk_factors": [],
#                                 "mitigation_strategies": [],
#                                 "risk_reward_ratio": ""
#                             },
#                             "price_analysis": {
#                                 "current_price": "",
#                                 "target_prices": {
#                                     "short_term": [],
#                                     "medium_term": [],
#                                     "long_term": []
#                                 },
#                                 "price_drivers": [],
#                                 "volatility_assessment": ""
#                             }
#                         },
#                         "agent_id": str(result.agent_id),
#                         "extraction_method": str(result.extraction_method)
#                     }
#                     formatted_results.append(formatted_result)
                    
#                 except Exception as e:
#                     logger.error(f"Error formatting result: {e}")
#                     continue
        
#         # Log the formatted results
#         logger.info(f"Formatted results: {formatted_results}")
        
#         if not formatted_results:
#             return []
            
#         return formatted_results

#     except Exception as e:
#         logger.error(f"Research error: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))


# @app.post("/api/research")
# async def research(request: ResearchRequest):
#     """Process a research query and return analyzed results"""
#     logger.info(f"Received research request: {request.query}")
#     try:
#         if not request.query.strip():
#             raise HTTPException(status_code=400, detail="Query cannot be empty")
            
#         config_data, prompts = load_config()
#         config_data["query"] = request.query
#         if request.urls:
#             config_data["urls"] = request.urls
            
#         config = WebSearchConfig(**config_data)
#         agent = WebSearchAgent(config, prompts)
        
#         # Add error handling for the search process
#         try:
#             await agent.process_search_query(request.query)
#         except Exception as search_error:
#             logger.error(f"Search process error: {str(search_error)}")
#             raise HTTPException(status_code=500, detail="Search process failed")
        
#         formatted_results = []
#         for result in agent.results:
#             if result:
#                 formatted_results.append({
#                     "url": result.url,
#                     "title": result.title,
#                     "content": result.content,
#                     "timestamp": result.timestamp.isoformat(),
#                     "status": result.status,
#                     "summary": result.summary,
#                     "agent_id": result.agent_id,
#                     "extraction_method": result.extraction_method
#                 })
        
#         return formatted_results
        
#     except Exception as e:
#         logger.error(f"Research error: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))

def start():
    """Function to start the server when running directly"""
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

if __name__ == "__main__":
    start()