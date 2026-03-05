from .years.normalize_2021 import normalize_2021_data
from .years.normalize_2022 import normalize_2022_data
from .years.normalize_2023 import normalize_2023_data
from src.pipline.io.meta import CreateMetaData
from src.pipline.io.logger import get_logger, safe_call

LOG_FILE = r"C:\Users\maint\Desktop\Dev\Projects\Sandbox\nibrs_api\data\logs\nibrs_pipeline.log"
logger = get_logger(LOG_FILE)

def build_2021():
    release, table, year, columns, parquet_count, total_rows = safe_call(
        logger,
        "normalize_2021_data",
        normalize_2021_data,
    )

    manifest_path = safe_call(
        logger,
        "CreateMetaData(2021)",
        CreateMetaData,
        release=release,
        table=table,
        year=year,
        columns=columns,
        parquet_count=parquet_count,
        total_rows=total_rows,
    )
    return manifest_path

def build_2022():
    release, table, year, columns, parquet_count, total_rows = safe_call(
        logger,
        "normalize_2022_data",
        normalize_2022_data,
    )

    manifest_path = safe_call(
        logger,
        "CreateMetaData(2022)",
        CreateMetaData,
        release=release,
        table=table,
        year=year,
        columns=columns,
        parquet_count=parquet_count,
        total_rows=total_rows,
    )
    return manifest_path

def build_2023():
    release, table, year, columns, parquet_count, total_rows = safe_call(
        logger,
        "normalize_2023_data",
        normalize_2023_data,
    )

    manifest_path = safe_call(
        logger,
        "CreateMetaData(2023)",
        CreateMetaData,
        release=release,
        table=table,
        year=year,
        columns=columns,
        parquet_count=parquet_count,
        total_rows=total_rows,
    )
    return manifest_path

def normalize_all():
    manifest_2021_path = build_2021()
    manifest_2022_path = build_2022()
    manifest_2023_path = build_2023()
    logger.info("Manifest 2021 written: %s", manifest_2021_path)
    logger.info("Manifest 2022 written: %s", manifest_2022_path)
    logger.info("Manifest 2023 written: %s", manifest_2023_path)

if __name__ == "__main__":
    normalize_all()