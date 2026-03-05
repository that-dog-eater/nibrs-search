import duckdb

DUCKDB_PATH = r"C:\Users\maint\Desktop\Dev\Projects\Sandbox\nibrs_api\data\warehouse\duckdb\nibrs.duckdb"
SCHEMA = "r39270_v1"   # <-- your actual one
TABLE = "arrests"

def Connect():
     return duckdb.connect(DUCKDB_PATH, read_only=True)

def main():

      con = Connect()

      print(f"\nTABLES IN {SCHEMA}:",
            con.execute(f"SHOW TABLES FROM {SCHEMA};").fetchall())

      print("\nROW COUNT:",
            con.execute(f"SELECT COUNT(*) FROM {SCHEMA}.{TABLE};").fetchone())

      print("\nROWS BY YEAR:",
            con.execute(f"""
            SELECT year, COUNT(*)
            FROM {SCHEMA}.{TABLE}
            GROUP BY 1
            ORDER BY 1
            """).fetchall())

      print("\nSAMPLE:")
      print(con.execute(f"SELECT * FROM {SCHEMA}.{TABLE} LIMIT 5;").fetchdf())

      con.close()

if __name__ == "__main__":
    main()