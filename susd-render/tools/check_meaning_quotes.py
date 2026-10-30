#!/usr/bin/env python3
"""Check every quote in docs/01-MEANING.md against the line it cites.

A quote is text in straight double quotes. Its reference is the first tag after it on the same
logical line (bullet continuation lines are joined), or, if none follows, the last tag before it.
Tags:
  [BL n] or [BL n-m]            public_bootloader.md line n (or lines n..m joined)
  [M n · copy.ts:k]             src_copy.ts line k; its comment must name L<n>
  [RECORD n] or [RECORD n-m]    context_PROJECT-RECORD.md lines (whitespace-normalised)
  [TASTE]                       anywhere in TASTE.md (whitespace and '> ' normalised)
Quotes with no tag at all are listed for a manual look; they are not failures.

Usage: python3 check_meaning_quotes.py [path/to/01-MEANING.md]
"""
import re, sys, os

ROOT = "/home/user/Website-selling"
DOC = sys.argv[1] if len(sys.argv) > 1 else f"{ROOT}/susd-render/docs/01-MEANING.md"
BL = open(f"{ROOT}/susd-options/source/public_bootloader.md", encoding="utf-8").read().split("\n")
CP = open(f"{ROOT}/susd-options/source/src_copy.ts", encoding="utf-8").read().split("\n")
RC = open(f"{ROOT}/susd-options/source/context_PROJECT-RECORD.md", encoding="utf-8").read().split("\n")
TS = open(f"{ROOT}/susd-options/brief/TASTE.md", encoding="utf-8").read()

def norm(t):
    t = re.sub(r"(?m)^\s*>\s?", "", t)
    t = re.sub(r"(?m)^\s*-\s+", "", t)
    return re.sub(r"\s+", " ", t)

TS_N = norm(TS)
TAG = re.compile(r"\[(BL|M|RECORD|TASTE)([^\]]*)\]")
QUOTE = re.compile(r'"([^"\n]+)"')

def lines_of(src, spec):
    m = re.match(r"\s*(\d+)(?:\s*-\s*(\d+))?\s*$", spec)
    if not m:
        return None
    a = int(m.group(1)); b = int(m.group(2) or a)
    return src[a - 1:b]

def check(quote, kind, spec):
    if kind == "BL":
        specs = [x.strip().replace("BL", "").strip() for x in spec.split(",")]
        for sp in specs:
            ls = lines_of(BL, sp)
            if ls is None:
                continue
            raw = " ".join(ls)
            if quote in raw:
                return True, f"BL {sp}"
            if quote in raw.replace("*", ""):
                return True, f"BL {sp} (markdown stripped)"
        return False, f"BL {spec}"
    if kind == "M":
        m = re.match(r"\s*([\d,\s]+)·\s*copy\.ts:(\d+)\s*$", spec)
        if not m:
            return False, f"M {spec} (no copy.ts line)"
        mans = [x.strip() for x in m.group(1).split(",") if x.strip()]
        k = int(m.group(2)); line = CP[k - 1]
        okq = quote in line
        okc = all(f"L{n}" in line for n in mans)
        return okq and okc, f"copy.ts:{k} quote={'ok' if okq else 'MISSING'} comment={'ok' if okc else 'MISSING'}"
    if kind == "RECORD":
        ls = lines_of(RC, spec)
        return (ls is not None and quote in norm("\n".join(ls))), f"RECORD {spec.strip()}"
    if kind == "TASTE":
        return quote in TS_N, "TASTE"
    return False, kind

# join bullet/table continuation lines (indented) onto their parent line
BLOCK_START = re.compile(r"^(\||#|>|```|-\s|\d+\.\s)")
logical = []
for ln in open(DOC, encoding="utf-8").read().split("\n"):
    prev = logical[-1] if logical else ""
    continues = (
        ln.strip() and prev.strip()
        and not ln.lstrip().startswith(("|", "```"))
        and not prev.lstrip().startswith(("|", "```", "#"))
        and (ln.startswith("  ") or not BLOCK_START.match(ln))
    )
    if continues:
        logical[-1] += " " + ln.strip()
    else:
        logical.append(ln)

ok = bad = untagged = 0
in_code = False
for ln in logical:
    if ln.strip().startswith("```"):
        in_code = not in_code
        continue
    if in_code:
        continue
    tags = [(m.start(), m.group(1), m.group(2)) for m in TAG.finditer(ln)]
    for q in QUOTE.finditer(ln):
        after = [t for t in tags if t[0] >= q.end()]
        # a tag after the quote counts only if no other quote opens in between
        if after and not QUOTE.search(ln[q.end():after[0][0]]):
            _, kind, spec = after[0]
        else:
            before = [t for t in tags if t[0] < q.start()]
            if not before:
                if after:
                    _, kind, spec = after[0]
                else:
                    untagged += 1
                    print(f"  untagged : \"{q.group(1)[:70]}\"")
                    continue
            else:
                _, kind, spec = before[-1]
        good, where = check(q.group(1), kind, spec)
        if good:
            ok += 1
        else:
            bad += 1
            print(f"  FAIL     : \"{q.group(1)[:90]}\"  ->  {where}")

print(f"\n{ok} quotes verified, {bad} failed, {untagged} untagged (look at these by hand)")
sys.exit(1 if bad else 0)
