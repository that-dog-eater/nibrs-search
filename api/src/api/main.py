
from fastapi import FastAPI
from src.api.routes.incidents import router as incidents_router
from src.api.routes.arrests import router as arrests_router
from src.api.routes.meta import router as metadata_router

app = FastAPI(title="nibrs_api")

app.include_router(incidents_router)
app.include_router(arrests_router)
app.include_router(metadata_router)

@app.get("/")
def root():
    return {"hello": "world"}