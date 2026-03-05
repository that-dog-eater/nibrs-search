import hashlib
import pandas as pd

# === NORMALIZATION HELPERS ===
def normalize_date(val):
    if pd.isna(val):
        return None
    return pd.to_datetime(val, errors="coerce").strftime("%Y-%m-%d")

def build_incident_id(row, release, year):
    key = f"{release}|{year}|{row['ORI']}|{row['INCNUM']}"
    return hashlib.sha1(key.encode("utf-8")).hexdigest()

# === MAIN BUILDER ===
def Build_new_df(raw_df: pd.DataFrame, release: str, year: int, SCHEMA: dict[str, str] ) -> pd.DataFrame:
    out_df = raw_df.copy()
    out_df.columns = out_df.columns.str.strip().str.upper()

    # ensure all SOURCE columns exist
    for src_col in SCHEMA.keys():
        if src_col not in out_df.columns:
            out_df[src_col] = None

    # inject constant columns
    out_df["YEAR"] = year
    out_df["RELEASE"] = release

    # keep date normalization exactly as before (for data, not identity)
    date_iso = pd.to_datetime(
        out_df["INCDATE"],
        format="%d-%b-%Y",
        errors="coerce"
    ).dt.strftime("%Y-%m-%d")

    # build INCIDENT_ID (INCDATE REMOVED FROM KEY)
    out_df["INCIDENT_ID"] = (
        (release + "|" + str(year) + "|" +
         out_df["ORI"].astype(str) + "|" +
         out_df["INCNUM"].astype(str))
        .map(lambda s: hashlib.sha1(s.encode("utf-8")).hexdigest())
    )

    # select + rename
    out_df = out_df[list(SCHEMA.keys())].copy()
    out_df = out_df.rename(columns=SCHEMA)

    return out_df