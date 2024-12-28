from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import yaml
import os
from pathlib import Path
from market_agents.research_agents.research_agent_enhanced import WebSearchAgent

router = APIRouter()

def load_config():
    config_path = Path(__file__).parent.parent.parent.parent.parent / "research_agents" / "web_search_config.yaml"
    prompt_path = Path(__file__).parent.parent.parent.parent.parent / "research_agents" / "web_search_prompt.yaml"
    
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
    with open(prompt_path, 'r') as f:
        prompts = yaml.safe_load(f)
    return config, prompts

@router.post("/research/search")
async def perform_research(query: Dict[str, str]):
    try:
        config, prompts = load_config()
        agent = WebSearchAgent(config, prompts)
        results = await agent.process_search_query(query["query"])
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/research/history")
async def get_research_history():
    # For now, return empty list as history isn't implemented
    return []