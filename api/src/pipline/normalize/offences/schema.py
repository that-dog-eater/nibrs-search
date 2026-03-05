RAW_KEEP_V1_SCHEMA: dict[str, str] = {
    "INCIDENT_ID": "INCIDENT_ID",
    
    "ORI": "ORI",
    "INCNUM": "INCNUM",
    "INCDATE": "INCDATE",

    "V20071": "OFFENSE_SEQ_NUM",
    "V20061": "OFFENSE_CODE",
    "V20072": "ATTEMPTED_COMPLETED",
    "V20171": "WEAPON_CODE",
    "V20091": "BIAS_MOTIVATION",
    "V20111": "LOCATION_TYPE",

    "STATE": "STATE",
    "FIPS_STATE": "FIPS_STATE",
    "YEAR": "YEAR",
    "RELEASE": "RELEASE",
}

def Build_new_df(raw_df):
    out_df = raw_df.copy()
    out_df.columns = out_df.columns.str.strip().str.upper()

    # ensure all SOURCE columns exist
    for src_col in RAW_KEEP_V1_SCHEMA.keys():
        if src_col not in out_df.columns:
            out_df[src_col] = None

    # select + rename to output columns
    out_df = out_df[list(RAW_KEEP_V1_SCHEMA.keys())].copy()
    out_df = out_df.rename(columns=RAW_KEEP_V1_SCHEMA)

    return out_df
