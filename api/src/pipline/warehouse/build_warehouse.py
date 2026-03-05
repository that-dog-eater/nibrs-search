import os
import duckdb

BASE_PARQUET = r"C:\Users\maint\Desktop\Dev\Projects\Sandbox\nibrs_api\data\staged\parquet"
DUCKDB_PATH  = r"C:\Users\maint\Desktop\Dev\Projects\Sandbox\nibrs_api\data\warehouse\duckdb\nibrs.duckdb"

RELEASES = {
    "38807-v1": ["incidents", "offenses", "victims", "arrests"],
    "38925-v1": ["incidents", "offenses", "victims", "arrests"],
    "39270-v1": ["incidents", "offenses", "victims", "arrests"],
}

def schema_name(release: str) -> str:
    # DuckDB schema names can't contain '-'
    return "r" + release.replace("-", "_")

def parquet_glob(release: str, table: str) -> str:
    p = os.path.join(
        BASE_PARQUET,
        f"release={release}",
        f"table={table}",
        "**",
        "*.parquet",
    )
    return p.replace("\\", "/")  # DuckDB prefers forward slashes

def build(con: duckdb.DuckDBPyConnection):
    con.execute("PRAGMA threads=8;")

    for release, tables in RELEASES.items():
        sch = schema_name(release)
        con.execute(f"CREATE SCHEMA IF NOT EXISTS {sch};")

        for table in tables:
            glob_path = parquet_glob(release, table)
            view_name = f"{sch}.{table}"

            con.execute(f"""
                CREATE OR REPLACE VIEW {view_name} AS
                SELECT *
                FROM read_parquet('{glob_path}', hive_partitioning=1);
            """)

            # quick sanity check
            cnt = con.execute(f"SELECT COUNT(*) FROM {view_name};").fetchone()[0]
            print(f"[✓] {view_name} -> {cnt:,} rows")

def build_warehouse():
    os.makedirs(os.path.dirname(DUCKDB_PATH), exist_ok=True)
    con = duckdb.connect(DUCKDB_PATH)

    build(con)

    con.close()
    print(f"[✓] Warehouse built: {DUCKDB_PATH}")

if __name__ == "__main__":
    build_warehouse()
