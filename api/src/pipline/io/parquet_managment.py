import pyarrow as pa
import pyarrow.parquet as pq
import os

def Create_Parquet(df, parquet_number, release, table, year):

    BASE_OUT = r"C:\Users\maint\Desktop\Dev\Projects\Sandbox\nibrs_api\data\staged\parquet"

    out_dir = os.path.join(
        BASE_OUT,
        f"release={release}",
        f"table={table}",
        f"year={year}"
    )
    os.makedirs(out_dir, exist_ok=True)

        # convert to Arrow table
    table = pa.Table.from_pandas(df, preserve_index=False)

    out_path = os.path.join(out_dir, f"part-{parquet_number:05d}.parquet")

    pq.write_table(
        table,
        out_path,
        compression="zstd",
        use_dictionary=True
    )

    print(f"[+] wrote {out_path} ({len(df)} rows)")

