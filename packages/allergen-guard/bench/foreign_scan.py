#!/usr/bin/env python3 -I
"""Foreign text filed as English (2026-10-11 scans). Usage: foreign_scan.py <food.parquet> <phrases|words|sample> > rows.jsonl

phrases: English ingredient text holding a foreign may-contain phrase.
words:   English ingredient text holding 2+ allergen word stems of one other language (a whole list left untranslated).
sample:  every row with English ingredient text in 12 random row groups (random.seed(7)), the spot check's control sample.
Each output row has the fields off_rows.py emits plus `phrases` (what matched); foreign_judge.mjs runs the engine on them.
Matching is on lowercase, accent-folded text. These lists find candidates; they are not the engine's lists.
"""
import sys, json, re, random, unicodedata
from multiprocessing import Pool
import pyarrow.parquet as pq

COLS = ["code", "allergens_tags", "traces_tags", "ingredients_tags", "ingredients_original_tags", "labels_tags", "ingredients_text", "unique_scans_n"]
PHRASES = {
 "pl:moze zawierac": r"moze zawierac", "pl:moga zawierac": r"moga zawierac", "pl:mozliwa obecnosc": r"mozliwa obecnosc",
 "cs:muze obsahovat": r"muze obsahovat", "cs:mohou obsahovat": r"mohou obsahovat", "sk:moze obsahovat": r"moze obsahovat", "sk:mozu obsahovat": r"mozu obsahovat",
 "ro:poate contine": r"poate contine", "ro:urme de": r"\burme de\b",
 "hu:tartalmazhat": r"tartalmazhat", "hu:nyomokban": r"nyomokban",
 "fi:voi sisaltaa": r"voi sisaltaa", "fi:saattaa sisaltaa": r"saattaa sisaltaa",
 "hr:moze sadrzavati": r"moze sadrzavati", "sr:moze sadrzati": r"moze sadrzati", "sl:lahko vsebuje": r"lahko vsebuj", "sl:sledi": r"\bsledi\b",
 "et:voib sisaldada": r"voib sisaldada", "lv:var saturet": r"var saturet", "lt:gali tureti": r"gali tureti", "lt:gali buti": r"gali buti",
 "da:kan indeholde": r"kan indeholde", "da:spor af": r"\bspor af\b", "sv:kan innehalla": r"kan innehalla", "sv:spar av": r"\bspar av\b", "no:kan inneholde": r"kan inneholde", "no:spor av": r"\bspor av\b",
 "is:getur innihaldid": r"getur innihald",
 "nl:kan sporen": r"kan sporen", "nl:sporen van": r"sporen van", "nl:kan bevatten": r"\bkan\b[^.]{0,60}\bbevatten\b", "nl:geproduceerd waar ook": r"(?:geproduceerd|gemaakt|bereid) in een (?:\w+ ){0,2}(?:bedrijf|omgeving|fabriek)",
 "de:kann spuren": r"kann spuren", "de:spuren von": r"spuren von", "de:kann enthalten": r"\bkann\b[^.]{0,60}\benthalten\b", "de:betrieb der auch": r"(?:hergestellt|produziert) in einem (?:\w+ ){0,2}(?:betrieb|werk|umfeld)",
 "fr:peut contenir": r"peut contenir", "fr:traces de": r"traces? (?:eventuelles? )?de", "fr:atelier qui": r"(?:atelier|usine|site) qui (?:utilise|manipule|transforme|fabrique)",
 "it:puo contenere": r"puo contenere", "it:tracce di": r"tracce di", "it:stabilimento che": r"stabilimento (?:che|dove)",
 "es:puede contener": r"puede contener", "es:trazas de": r"trazas de", "es:planta que": r"(?:planta|fabrica|instalaciones?) (?:que|donde)",
 "pt:pode conter": r"pode conter", "pt:vestigios de": r"vestigios de", "ca:pot contenir": r"pot contenir",
 "tr:icerebilir": r"icerebilir", "tr:eser miktarda": r"eser miktarda",
 "id:dapat mengandung": r"(?:dapat|mungkin|boleh) mengandung", "vi:co the chua": r"co the chua", "tl:maaaring maglaman": r"maaaring may",
}
WORDS = {'lt:kvieti': r'\bkvieti', 'lt:kvieci': r'\bkvieci', 'lt:pien': r'\bpien', 'lt:riesut': r'\briesut', 'lt:soj': r'\bsoj', 'lt:kiausin': r'\bkiausin', 'lt:zemes riesut': r'\bzemes riesut', 'lt:sezam': r'\bsezam', 'lt:garstyc': r'\bgarstyc', 'lt:salier': r'\bsalier', 'lv:kviesu': r'\bkviesu', 'lv:piena': r'\bpiena', 'lv:rieksti': r'\brieksti', 'lv:soja': r'\bsoja', 'lv:olu': r'\bolu', 'lv:zemesrieksti': r'\bzemesrieksti', 'lv:sezama': r'\bsezama', 'lv:sinep': r'\bsinep', 'lv:selerij': r'\bselerij', 'et:nisu': r'\bnisu', 'et:piim': r'\bpiim', 'et:pahkl': r'\bpahkl', 'et:soja': r'\bsoja', 'et:muna': r'\bmuna', 'et:maapahkl': r'\bmaapahkl', 'et:seesam': r'\bseesam', 'et:sinep': r'\bsinep', 'et:seller': r'\bseller', 'fi:vehna': r'\bvehna', 'fi:maito': r'\bmaito', 'fi:pahkina': r'\bpahkina', 'fi:soija': r'\bsoija', 'fi:kananmuna': r'\bkananmuna', 'fi:maapahkina': r'\bmaapahkina', 'fi:seesami': r'\bseesami', 'fi:sinappi': r'\bsinappi', 'fi:selleri': r'\bselleri', 'fi:manteli': r'\bmanteli', 'fi:cashew': r'\bcashew', 'hu:buzaliszt': r'\bbuzaliszt', 'hu:tejpor': r'\btejpor', 'hu:tejsavo': r'\btejsavo', 'hu:mogyoro': r'\bmogyoro', 'hu:dio': r'\bdio', 'hu:szoja': r'\bszoja', 'hu:tojas': r'\btojas', 'hu:foldimogyoro': r'\bfoldimogyoro', 'hu:szezam': r'\bszezam', 'hu:mustar': r'\bmustar', 'hu:zeller': r'\bzeller', 'hu:buza': r'\bbuza', 'cs:psenic': r'\bpsenic', 'cs:mlek': r'\bmlek', 'cs:mlecn': r'\bmlecn', 'cs:orech': r'\borech', 'cs:soj': r'\bsoj', 'cs:vejce': r'\bvejce', 'cs:vajec': r'\bvajec', 'cs:arasid': r'\barasid', 'cs:sezam': r'\bsezam', 'cs:horcic': r'\bhorcic', 'cs:celer': r'\bceler', 'pl:pszen': r'\bpszen', 'pl:mleko': r'\bmleko', 'pl:mleczn': r'\bmleczn', 'pl:orzech': r'\borzech', 'pl:soj': r'\bsoj', 'pl:jaja': r'\bjaja', 'pl:jajk': r'\bjajk', 'pl:arachid': r'\barachid', 'pl:sezam': r'\bsezam', 'pl:gorczyc': r'\bgorczyc', 'pl:seler': r'\bseler', 'ro:grau': r'\bgrau', 'ro:lapte': r'\blapte', 'ro:nuci': r'\bnuci', 'ro:alune': r'\balune', 'ro:soia': r'\bsoia', 'ro:oua': r'\boua', 'ro:arahide': r'\barahide', 'ro:susan': r'\bsusan', 'ro:mustar': r'\bmustar', 'ro:telina': r'\btelina', 'sl:psenic': r'\bpsenic', 'sl:mleko': r'\bmleko', 'sl:mlecn': r'\bmlecn', 'sl:oresk': r'\boresk', 'sl:soj': r'\bsoj', 'sl:jajc': r'\bjajc', 'sl:arasid': r'\barasid', 'sl:sezam': r'\bsezam', 'sl:gorcic': r'\bgorcic', 'sl:zelen': r'\bzelen', 'hr:psenic': r'\bpsenic', 'hr:mlijek': r'\bmlijek', 'hr:mlijecn': r'\bmlijecn', 'hr:orasast': r'\borasast', 'hr:lijesnjak': r'\blijesnjak', 'hr:soj': r'\bsoj', 'hr:jaja': r'\bjaja', 'hr:jaje': r'\bjaje', 'hr:kikiriki': r'\bkikiriki', 'hr:sezam': r'\bsezam', 'hr:senf': r'\bsenf', 'hr:celer': r'\bceler', 'tr:bugday': r'\bbugday', 'tr:sut': r'\bsut', 'tr:findik': r'\bfindik', 'tr:ceviz': r'\bceviz', 'tr:soya': r'\bsoya', 'tr:yumurta': r'\byumurta', 'tr:yer fistigi': r'\byer fistigi', 'tr:susam': r'\bsusam', 'tr:hardal': r'\bhardal', 'tr:kereviz': r'\bkereviz', 'sv:vete': r'\bvete', 'sv:mjolk': r'\bmjolk', 'sv:notter': r'\bnotter', 'sv:hasselnot': r'\bhasselnot', 'sv:soja': r'\bsoja', 'sv:agg': r'\bagg', 'sv:jordnot': r'\bjordnot', 'sv:sesam': r'\bsesam', 'sv:senap': r'\bsenap', 'sv:selleri': r'\bselleri'}
MODE = sys.argv[2] if len(sys.argv) > 2 else "phrases"
CAND = PHRASES if MODE == "phrases" else WORDS
RX = {k: re.compile(v) for k, v in CAND.items()}
ANY = re.compile("|".join(f"(?:{v})" for v in CAND.values()))
fold = lambda s: "".join(c for c in unicodedata.normalize("NFKD", s.lower()) if not unicodedata.combining(c)).replace("ł", "l")
lst = lambda v: [x for x in v if isinstance(x, str)] if v else []

def matches(f):
    ph = [k for k, r in RX.items() if r.search(f)]
    if MODE == "phrases":
        return ph
    langs = {}
    for k in ph:
        langs.setdefault(k.split(":")[0], set()).add(k)
    return sorted(l for l, ks in langs.items() if len(ks) >= 2)

def work(args):
    path, rg = args
    t = pq.ParquetFile(path).read_row_group(rg, columns=COLS).to_pydict()
    out = []
    for i in range(len(t["code"])):
        en = next((e.get("text") for e in (t["ingredients_text"][i] or []) if e and e.get("lang") == "en" and e.get("text")), "")
        if not en:
            continue
        f = fold(en)
        if MODE == "sample":
            ph = ["sample"]
        elif not ANY.search(f):
            continue
        else:
            ph = matches(f)
        if not ph:
            continue
        out.append({"code": t["code"][i] or "", "allergens_tags": lst(t["allergens_tags"][i]), "traces_tags": lst(t["traces_tags"][i]),
                    "ingredients_tags": lst(t["ingredients_tags"][i]), "ingredients_original_tags": lst(t["ingredients_original_tags"][i]),
                    "labels_tags": lst(t["labels_tags"][i]), "ingredients_text_en": en, "unique_scans_n": t["unique_scans_n"][i] or 0, "phrases": ph})
    return out

if __name__ == "__main__":
    path = sys.argv[1]
    groups = range(pq.ParquetFile(path).num_row_groups)
    if MODE == "sample":
        random.seed(7)
        groups = random.sample(groups, 12)
    with Pool(8) as p:
        for rows in (p.imap if MODE == "sample" else p.imap_unordered)(work, [(path, g) for g in groups]):
            for r in rows:
                sys.stdout.write(json.dumps(r, ensure_ascii=False) + "\n")
