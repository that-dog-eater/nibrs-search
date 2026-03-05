# src/routes/incidents.py

from fastapi import APIRouter, Query, HTTPException
from src.query.duckdb_client import Connect
from src.pipline.warehouse.build_warehouse import schema_name
from src.api.queries.incidents.sql import build_list_incidents_sql
from src.api.queries.incidents.bundle import bundle_incidents

router = APIRouter(prefix="/v1", tags=["v1"])

AVAILABLE_VERSIONS = {"38925-v1", "39270-v1"}

YEAR_TO_VERSION = {
    2022: "38925-v1",
    2023: "39270-v1",
}

@router.get("/incidents")
def get_incidents(
    year: int = Query(..., ge=1900, le=2100),
    limit: int = Query(5000, ge=1, le=10_000),
    offset: int = Query(0, ge=0),
    #release: str = Query("38925-v1"),

    state: str | None = Query(None),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    has: list[str] | None = Query(None),
    offense_code: list[str] | None = Query(None),
    location_code: list[str] | None = Query(None),

    incident_id: str | None = Query(None),

    bundle: bool = Query(False), 
):
    release = YEAR_TO_VERSION.get(year)
    if not release:
        raise HTTPException(
            400,
            f"No release available for year {year}. Available years: {sorted(YEAR_TO_VERSION.keys())}"
        )

    if release not in AVAILABLE_VERSIONS:
        raise HTTPException(400, f"Unavailable Version: '{release}'. Options: {sorted(AVAILABLE_VERSIONS)}")

    schema = schema_name(release=release)

    sql, params = build_list_incidents_sql(
        schema,
        year=year,
        limit=limit,
        offset=offset,
        state=state,
        date_from=date_from,
        date_to=date_to,
        has=has,
        offense_code=offense_code,
        location_code=location_code,
        incident_id=incident_id,

        
    )

    con = Connect()
    try:
        cur = con.execute(sql, params)
        cols = [d[0] for d in cur.description]
        rows = cur.fetchall()
        result = [dict(zip(cols, r)) for r in rows]

        if bundle:
            if limit > 200:
                raise HTTPException(400, "bundle=true requires limit <= 200")
            result = bundle_incidents(con, schema=schema, incidents=result)

        return result
    except Exception as e:
        raise HTTPException(500, str(e))
    finally:
        con.close()