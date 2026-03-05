import pandas as pd

def CreateDataFrame(path_to_csv):
    df = pd.read_csv(path_to_csv, sep="\t", nrows=2000)
    return df

def CreateChunkDataFrame(path_to_tsv):
    chunks = pd.read_csv(
        path_to_tsv,
        sep="\t",
        dtype=str,
        chunksize=250_000,
        low_memory=False,
    )

    return chunks
