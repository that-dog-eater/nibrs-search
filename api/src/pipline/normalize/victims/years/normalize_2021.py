from src.pipline.io.nibrs_parse import CreateDataFrame, CreateChunkDataFrame
from src.pipline.io.parquet_managment import Create_Parquet
from ..schema import RAW_KEEP_V1_SCHEMA as columns
from src.pipline.normalize.schema_logic import Build_new_df
import os
import pyarrow as pa
import pyarrow.parquet as pq

path_to_CSV = r"C:\Users\maint\Desktop\Dev\Projects\Sandbox\nibrs_api\data\raw\icpsr\2021\38807-V1\DS0004\38807-0004-Data.tsv"

BASE_OUT = r"C:\Users\maint\Desktop\Dev\Projects\Sandbox\nibrs_api\data\staged\parquet"
RELEASE = "38807-v1"
TABLE = "victims"
YEAR = "2021"

# 
def normalize_2021_data():
    chunks = CreateChunkDataFrame(path_to_tsv=path_to_CSV)

    chunk_nunber = 0
    parquet_count = 0 
    total_rows = 0 

    for raw_df in chunks:
        raw_df.columns = raw_df.columns.str.strip().str.upper()

        nomralized_df = Build_new_df(raw_df=raw_df, release=RELEASE, year=YEAR, SCHEMA=columns)

        chunk_nunber = chunk_nunber + 1
        parquet_count = parquet_count + 1
        total_rows += len(raw_df)

        Create_Parquet(
            df=nomralized_df,
            parquet_number=chunk_nunber,
            release=RELEASE,
            table=TABLE,
            year=YEAR,
        )

    print("[✓] 2022 normalization complete")

     

    return (
        RELEASE,
        TABLE,
        YEAR, 
        columns,
        parquet_count,
        total_rows
    )



if __name__ == "__main__":
    normalize_2021_data()