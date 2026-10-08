#!/usr/bin/env python3 -I
"""Stream Open Food Facts parquet rows as JSON lines. Usage: off_rows.py <parquet> <shard_index> <shard_count>"""
import sys, json
import pyarrow.parquet as pq

COLS = ["code", "allergens_tags", "traces_tags", "ingredients_tags", "ingredients_original_tags", "ingredients_text", "unique_scans_n"]

def lst(v):
    return [x for x in v if isinstance(x, str)] if v else []

def main():
    path, idx, cnt = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
    pf = pq.ParquetFile(path)
    out = sys.stdout
    for rg in range(pf.num_row_groups):
        if rg % cnt != idx:
            continue
        t = pf.read_row_group(rg, columns=COLS)
        d = t.to_pydict()
        for i in range(t.num_rows):
            en, first = "", ""
            for e in d["ingredients_text"][i] or []:
                if not e: continue
                txt = e.get("text") or ""
                if not en and e.get("lang") == "en" and txt:
                    en = txt
                if not first and txt.strip():
                    first = txt
            out.write(json.dumps({
                "code": d["code"][i] or "",
                "allergens_tags": lst(d["allergens_tags"][i]),
                "traces_tags": lst(d["traces_tags"][i]),
                "ingredients_tags": lst(d["ingredients_tags"][i]),
                "ingredients_original_tags": lst(d["ingredients_original_tags"][i]),
                "ingredients_text_en": en,
                "ingredients_text": first,
                "unique_scans_n": d["unique_scans_n"][i] or 0,
            }, ensure_ascii=False) + "\n")
        del t, d

main()
