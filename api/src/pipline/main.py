from src.pipline.io.logger import get_logger, safe_call
from src.pipline.normalize.incidents.build import normalize_all as normalize_incidents
from src.pipline.normalize.offences.build import normalize_all as normalize_offences
from src.pipline.normalize.victims.build import normalize_all as normalize_victims
from src.pipline.normalize.arrests.build import normalize_all as normalize_arrests
from src.pipline.warehouse.build_warehouse import build_warehouse

LOG_FILE = r"C:\Users\maint\Desktop\Dev\Projects\Sandbox\nibrs_api\data\logs\nibrs_pipeline.log"
logger = get_logger(LOG_FILE)

def main():
    safe_call(logger, "normalize_incidents", normalize_incidents)
    safe_call(logger, "normalize_offences", normalize_offences)
    safe_call(logger, "normalize_victims", normalize_victims)
    safe_call(logger, "normalize_arrests", normalize_arrests)
    safe_call(logger, "build_warehouse", build_warehouse)

if __name__ == "__main__":
    logger.info("[BUILDING] Rebuilding everything...")
    safe_call(logger, "__main__/main", main)