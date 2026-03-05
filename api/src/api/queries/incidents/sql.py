from typing import Any, List, Tuple, Optional
from src.api.queries.incidents.state_to_fips import STATE_TO_FIPS


def build_list_incidents_sql(
    schema: str,
    *,
    year: int,
    limit: int,
    offset: int,
    state: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    has: Optional[List[str]] = None,
    offense_code: Optional[List[str]] = None,
    location_code: Optional[List[str]] = None,
    incident_id: Optional[str] = None,
) -> Tuple[str, List[Any]]:

    where: List[str] = []
    params: List[Any] = []

    # mandatory
    where.append("year = ?")
    params.append(year)

    # optional filters (1 block = 1 option)

    if state:
        s = state.strip().upper()
        if s.isdigit():
            fips = s.zfill(2)
        else:
            fips = STATE_TO_FIPS.get(s)

        if not fips:
            raise ValueError(f"Unknown state '{state}'. Use like NJ or 34.")

        where.append("FIPS_STATE = ?")
        params.append(fips)

    if date_from:
        where.append("incdate >= ?")
        params.append(date_from)

    if date_to:
        where.append("incdate <= ?")
        params.append(date_to)

    if has:
        for h in has:
            where.append(f"incnum IN (SELECT incnum FROM {schema}.{h})")

    def _in_placeholders(n: int) -> str:
        return ", ".join(["?"] * n)

    if offense_code:
        codes = [str(x).strip() for x in offense_code if str(x).strip()]
        if codes:
            where.append(
                f"""incident_id IN (
                    SELECT incident_id
                    FROM {schema}.offenses
                    WHERE year = ?
                    AND CAST(offense_code AS VARCHAR) IN ({_in_placeholders(len(codes))})
                )"""
            )
            params.append(year)
            params.extend(codes)

    if location_code:
        codes = [str(x).strip() for x in location_code if str(x).strip()]
        if codes:
            where.append(
                f"""incident_id IN (
                    SELECT incident_id
                    FROM {schema}.offenses
                    WHERE year = ?
                    AND CAST(location_type AS VARCHAR) IN ({_in_placeholders(len(codes))})
                )"""
            )
            params.append(year)
            params.extend(codes)

    if incident_id:
        iid = incident_id.strip()
        if iid:
            where.append("incident_id = ?")
            params.append(iid)

    # final assembly
    sql = f"""
        SELECT *
        FROM {schema}.incidents
        WHERE {" AND ".join(where)}
        LIMIT ? OFFSET ?;
    """
    params.extend([limit, offset])

    return sql, params