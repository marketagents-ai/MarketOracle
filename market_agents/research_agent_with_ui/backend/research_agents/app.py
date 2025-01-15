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



@app.post("/api/custom")
async def custom_chat(
    message: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    try:
        logger.info(f"Received message: {message}, file: {file.filename if file else None}")
        
        if not message and not file:
            raise HTTPException(
                status_code=400, 
                detail="Either message or file is required for analysis"
            )

        # Handle message-only case
        if message and not file:
            try:
                # Use GPT-4 for generating responses
                response = await client.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": "You are an expert financial analyst and trading advisor. Provide detailed, accurate, and actionable insights."},
                        {"role": "user", "content": message}
                    ],
                    temperature=0.7,
                    max_tokens=1000
                )
                
                return {
                    "content": response.choices[0].message.content,
                    "timestamp": datetime.now().isoformat()
                }
            except Exception as e:
                logger.error(f"OpenAI API error: {str(e)}")
                return {
                    "content": "I apologize, but I'm having trouble processing your request at the moment.",
                    "timestamp": datetime.now().isoformat()
                }

        # Handle file case
        if file:
            content = await file.read()
            return {
                "content": f"Processed file: {file.filename}" + (f" with message: {message}" if message else ""),
                "timestamp": datetime.now().isoformat()
            }

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
        
        # Return the raw results directly
        return agent.results

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