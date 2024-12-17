from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from market_agents.research_agent_enhanced import ResearchAgent

router = APIRouter()

@router.post("/search")
async def search_query(query: Dict[str, str]):
    try:
        agent = ResearchAgent()
        results = await agent.process_query(query["query"])
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
async def get_research_history():
    try:
        # Implement research history retrieval
        return []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))