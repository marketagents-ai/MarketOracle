from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import tools
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import tools, research

app = FastAPI()
app.include_router(tools.router, prefix="/api/tools")
app.include_router(research.router, prefix="/api/research")


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(tools.router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
