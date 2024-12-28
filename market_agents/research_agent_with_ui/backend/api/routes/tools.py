# backend/api/routes/tools.py
from fastapi import APIRouter, HTTPException
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel

router = APIRouter()

class Tool(BaseModel):
    id: Optional[int] = None
    name: str
    description: str
    parameters: Dict[str, Any] = {}
    created_at: Optional[datetime] = None

tools: List[Dict[str, Any]] = []
tool_counter = 0

@router.get("/tools", response_model=List[Tool])
async def get_tools():
    return tools

@router.post("/tools", response_model=Tool)
async def create_tool(tool: Tool):
    global tool_counter
    tool_counter += 1
    tool_dict = tool.dict()
    tool_dict["id"] = tool_counter
    tool_dict["created_at"] = datetime.now()
    tools.append(tool_dict)
    return tool_dict