from fastapi import APIRouter, Query, HTTPException
from src.query.duckdb_client import Connect
import os
import json

router = APIRouter(prefix="/v1", tags=["v1"])

MANIFEST_BASE = r"C:\Users\maint\Desktop\Dev\Projects\Sandbox\nibrs_api\data\manifest"
ALLOWED_RELEASES = {"38925-v1"}

def manifest_path(release: str, table: str) -> str:
    return os.path.join(
        MANIFEST_BASE,
        f"release={release}",
        f"table={table}.json"
    )

@router.get("/metadata/{table}")
def get_table_metadata(
    table: str,
    release: str = Query("38925-v1")
):
    if release not in ALLOWED_RELEASES:
        raise HTTPException(400, f"Unknown release '{release}'")

    path = manifest_path(release, table)

    if not os.path.exists(path):
        raise HTTPException(404, f"No manifest for release='{release}' table='{table}'")
    
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError:
        raise HTTPException(500, f"Manifest is corrupted: {path}")