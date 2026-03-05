RAW_KEEP_V1_SCHEMA: dict[str, str] = {
    "INCIDENT_ID": "INCIDENT_ID",
    
    "ORI": "ORI",
    "INCNUM": "INCNUM",
    "INCDATE": "INCDATE",

    "V4006": "VICTIM_SEQ_NUM",            # Victim Sequence Number
    "V4018": "VICTIM_AGE",                # Age of Victim
    "V4019": "VICTIM_SEX",                # Sex of Victim
    "V4020": "VICTIM_RACE",               # Race of Victim
    "V4021": "VICTIM_ETHNICITY",          # Ethnicity of Victim
    "V4022": "VICTIM_RESIDENT_STATUS",    # Resident Status of Victim
    "V4030": "VICTIM_INJURY",              # Type of Injury
    "V4040": "RELATIONSHIP_TO_OFFENDER",  # Relationship Victim to Offender

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
