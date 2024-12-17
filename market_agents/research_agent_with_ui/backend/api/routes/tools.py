from fastapi import APIRouter, HTTPException
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel

router = APIRouter()

# Pydantic models
class ToolBase(BaseModel):
    schema_name: str
    schema_description: str
    instruction_string: str
    json_schema: Dict[str, Any]
    strict_schema: bool = True

class CallableToolBase(BaseModel):
    name: str
    description: str
    input_schema: Dict[str, Any]
    output_schema: Dict[str, Any]
    is_callable: bool = True

class Tool(ToolBase):
    id: int
    created_at: datetime

class AutoToolsUpdate(BaseModel):
    tool_ids: List[int]

# Global state (replace with database in production)
tools: List[Dict] = []
auto_tools_ids: List[int] = []
stop_tool_id: Optional[int] = None
tool_counter = 0

@router.get("/tools")
async def get_tools():
    return {
        "tools": tools,
        "autoToolsIds": auto_tools_ids,
        "stopToolId": stop_tool_id
    }

@router.post("/tools")
async def create_tool(tool: ToolBase | CallableToolBase):
    global tool_counter
    tool_counter += 1
    tool_dict = tool.dict()
    tool_dict["id"] = tool_counter
    tool_dict["created_at"] = datetime.now()
    tools.append(tool_dict)
    return tool_dict
