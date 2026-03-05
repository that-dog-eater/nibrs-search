from fastapi import APIRouter, Query, HTTPException
from src.query.duckdb_client import Connect
from src.pipline.warehouse.build_warehouse import schema_name

router = APIRouter(prefix="/v1", tags=["v1"])

AVALIBLE_VERSIONS = {"38925-v1","39270-v1"}

@router.get("/arrests")
def get_incidents(
    year: int = Query(..., ge=1900, le=2100),
    limit: int = 100,
    offset: int = 0,
    release: str = "38925-v1"
):
    if release not in AVALIBLE_VERSIONS:
        raise HTTPException(400, f"Unavalible Version: '{AVALIBLE_VERSIONS}'")
    
    schema = schema_name(release=release)

    sql = f"""
        SELECT *
        FROM {schema}.arrests
        WHERE year = ?
        LIMIT ? OFFSET ?;
    """
    params = [year, limit, offset]

    con = Connect()
    try:
        cur = con.execute(sql, params)
        cols = [d[0] for d in cur.description]
        rows = cur.fetchall()
        return [dict(zip(cols, r)) for r in rows]
    except Exception as e:
        raise HTTPException(500, str(e))
    finally:
        con.close()