# src/queries/incidents/bundle.py

from __future__ import annotations

from typing import Any, Dict, Iterable, List, Optional, Sequence, Set, Tuple


DEFAULT_INCLUDE: Set[str] = {"offenses", "victims", "arrests"}


def _detect_key(row: Dict[str, Any], candidates: Sequence[str]) -> Optional[str]:
    for k in candidates:
        if k in row:
            return k
    return None


def _rows_to_dicts(cur) -> List[Dict[str, Any]]:
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, r)) for r in cur.fetchall()]


def _table_columns(con, *, schema: str, table: str) -> Set[str]:
    # DuckDB: PRAGMA table_info('schema.table')
    full = f"{schema}.{table}"
    cur = con.execute(f"PRAGMA table_info('{full}')")
    # columns: cid, name, type, notnull, dflt_value, pk
    return {r[1] for r in cur.fetchall()}


def _pick_existing_column(
    con,
    *,
    schema: str,
    table: str,
    candidates: Sequence[str],
) -> Optional[str]:
    cols = _table_columns(con, schema=schema, table=table)
    for c in candidates:
        if c in cols:
            return c
    # case-insensitive fallback (keeps actual table column name)
    lower_map = {c.lower(): c for c in cols}
    for cand in candidates:
        hit = lower_map.get(cand.lower())
        if hit:
            return hit
    return None


def _fetch_by_keys(
    con,
    *,
    schema: str,
    table: str,
    keys: List[Any],
    key_candidates: Sequence[str],
) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    if not keys:
        return [], None

    col = _pick_existing_column(con, schema=schema, table=table, candidates=key_candidates)
    if not col:
        return [], None

    placeholders = ",".join(["?"] * len(keys))
    sql = f"SELECT * FROM {schema}.{table} WHERE {col} IN ({placeholders});"
    cur = con.execute(sql, keys)
    return _rows_to_dicts(cur), col


def bundle_incidents(
    con,
    *,
    schema: str,
    incidents: List[Dict[str, Any]],
    include: Optional[Iterable[str]] = None,
    # Prefer INCIDENT_ID, fallback to INCNUM
    parent_key_candidates: Sequence[str] = ("INCIDENT_ID", "incident_id", "INCNUM", "incnum"),
    child_key_candidates: Sequence[str] = ("INCIDENT_ID", "incident_id", "INCNUM", "incnum"),
) -> List[Dict[str, Any]]:
    """
    Attaches child records under incident["bundle"].

    Result shape:
      incident["bundle"] = {
         "offenses": [...],
         "victims": [...],
         "arrests": [...]
      }
    """
    include_set = set(include) if include is not None else set(DEFAULT_INCLUDE)

    if not incidents:
        return incidents

    # 1) detect parent join key from incident rows (INCIDENT_ID preferred)
    parent_key = _detect_key(incidents[0], parent_key_candidates)
    if not parent_key:
        for r in incidents:
            r["bundle"] = {k: [] for k in include_set}
        return incidents

    join_values = [r.get(parent_key) for r in incidents if r.get(parent_key) is not None]
    join_values = list(dict.fromkeys(join_values))  # stable unique

    for r in incidents:
        r["bundle"] = {k: [] for k in include_set}

    if not join_values:
        return incidents

    grouped: Dict[Any, Dict[str, List[Dict[str, Any]]]] = {
        v: {k: [] for k in include_set} for v in join_values
    }

    def ingest_child(table_name: str) -> None:
        rows, child_col = _fetch_by_keys(
            con,
            schema=schema,
            table=table_name,
            keys=join_values,
            key_candidates=child_key_candidates,
        )
        if not rows or not child_col:
            return

        for row in rows:
            v = row.get(child_col)
            if v in grouped:
                grouped[v][table_name].append(row)

    if "offenses" in include_set:
        ingest_child("offenses")
    if "victims" in include_set:
        ingest_child("victims")
    if "arrests" in include_set:
        ingest_child("arrests")

    for r in incidents:
        v = r.get(parent_key)
        r["bundle"] = grouped.get(v, {k: [] for k in include_set})

    return incidents