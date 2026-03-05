RAW_KEEP_V1_SCHEMA: dict[str, str] = {
    "INCIDENT_ID": "INCIDENT_ID",
    
    "ORI": "ORI",
    "INCNUM": "INCNUM",
    "INCDATE": "INCDATE",

    # arrests / arrestee-level fields (V-columns)
    "V6007": "ARREST_SEQ_NUM",              # Arrest transaction/sequence number
    "V6008": "ARREST_DATE",                 # Date of arrest
    "V6009": "ARREST_TYPE",                 # On-view / summoned / taken into custody
    "V6010": "MULTIPLE_ARREST_SEGMENT",     # Multiple arrest indicator
    "V6011": "ARREST_OFFENSE_CODE",         # UCR arrest offense code
    "V6014": "ARRESTEE_AGE",                # Arrestee age
    "V6015": "ARRESTEE_SEX",                # Arrestee sex :contentReference[oaicite:0]{index=0}
    "V6016": "ARRESTEE_RACE",               # Arrestee race :contentReference[oaicite:1]{index=1}
    "V6017": "ARRESTEE_ETHNICITY",          # Arrestee ethnicity :contentReference[oaicite:2]{index=2}
    "V6018": "RESIDENT_STATUS",             # Resident / non-resident :contentReference[oaicite:3]{index=3}
    
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
