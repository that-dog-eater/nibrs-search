import json
import os
from datetime import datetime

BASE_DIR = r"C:\Users\maint\Desktop\Dev\Projects\Sandbox\nibrs_api\data\manifest"

def CreateMetaData(
    release: str,
    table: str,
    year: int,
    columns: list[str],
    parquet_count: int,
    total_rows: int,
):
    print("META DATA")

    release_dir = os.path.join(BASE_DIR, f"release={release}")
    os.makedirs(release_dir, exist_ok=True)

    manifest_path = os.path.join(release_dir, f"table={table}.json")

    # build schema section
    schema = [
        {
            "name": col,
            "type": "string",     # you can upgrade this later
            "nullable": True      # safe default unless enforced
        }
        for col in columns
    ]

    manifest = {
        "release": release,
        "table": table,
        "source": "ICPSR",
        "created_at": datetime.utcnow().isoformat() + "Z",

        "partitioning": {
            "type": "hive",
            "keys": ["year"]
        },

        "schema": schema,

        "coverage": {
            "years": [year]
        },

        "files": {
            "count": parquet_count,
            "format": "parquet",
            "compression": "zstd"
        },

        "rows": {
            "total": total_rows
        }
    }

    tmp_path = manifest_path + ".tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    os.replace(tmp_path, manifest_path)

    print(f"[✓] manifest written: {manifest_path}")

    return manifest_path