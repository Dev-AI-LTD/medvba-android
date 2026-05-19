"""Parse UMF Neuroanatomie.docx affirmation questions (multi-select)."""
import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

DOCX = Path(r"c:\Users\octav\Desktop\acte\Neuroanatomie.docx")
OUT_JSON = Path(__file__).resolve().parent.parent / "content" / "neuroanatomy" / "sources" / "umf-exam-affirmations.json"
CORRECT_FILL = "7DEF66"  # green highlight = correct affirmation

STEM_PATTERNS = (
    re.compile(r"se poate afirma", re.I),
    re.compile(r"^Următoarele\b.+\:$", re.I),
    re.compile(r"^Selectați\b.+(corect|corectă)", re.I),
    re.compile(r"^Precizați\b.+\:$", re.I),
    re.compile(r"^Care\b.+\:$", re.I),
)


def is_stem(text: str) -> bool:
    t = text.strip()
    if not t:
        return False
    return any(p.search(t) for p in STEM_PATTERNS)


def para_text(p, ns):
    return "".join(t.text or "" for t in p.iter(f"{ns}t")).strip()


def para_fill(p, ns):
    shd = p.find(f".//{ns}shd")
    return shd.get(f"{ns}fill") if shd is not None else None


def parse_docx(path: Path):
    with zipfile.ZipFile(path) as z:
        root = ET.fromstring(z.read("word/document.xml"))
    ns = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
    paras = root.findall(f".//{ns}p")

    questions = []
    current = None

    for p in paras:
        t = para_text(p, ns)
        if not t or t.startswith("UMF") or "umfiasi" in t:
            continue

        if is_stem(t):
            if current and current["options"]:
                questions.append(current)
            current = {"stem": t, "options": []}
            continue

        if current is None:
            continue

        current["options"].append({"text": t, "fill": para_fill(p, ns)})

    if current and current["options"]:
        questions.append(current)

    return questions


def split_oversized_questions(raw_questions, chunk_size: int = 10):
    """UMF affirmation items are groups of 10 options; merge errors create oversized blocks."""
    result = []
    for question in raw_questions:
        options = question["options"]
        if len(options) <= chunk_size:
            result.append(question)
            continue
        for offset in range(0, len(options), chunk_size):
            chunk = options[offset : offset + chunk_size]
            if len(chunk) == chunk_size:
                result.append({"stem": question["stem"], "options": chunk})
    return result


def to_question_records(raw_questions):
    split = split_oversized_questions(raw_questions)
    records = []
    for i, q in enumerate(split, start=1):
        options = [o["text"] for o in q["options"]]
        correct = [j for j, o in enumerate(q["options"]) if o["fill"] == CORRECT_FILL]
        records.append(
            {
                "id": f"neuro-exam-aff-{i:03d}",
                "stem": q["stem"],
                "options": options,
                "correctAnswers": correct,
            }
        )
    return records


def main():
    docx = Path(sys.argv[1]) if len(sys.argv) > 1 else DOCX
    raw = parse_docx(docx)
    records = to_question_records(raw)

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")

    counts = [len(r["correctAnswers"]) for r in records]
    opt_counts = [len(r["options"]) for r in records]
    missing = sum(1 for r in records if not r["correctAnswers"])
    print(f"Parsed {len(records)} questions -> {OUT_JSON}")
    print(f"Options per question: min={min(opt_counts)}, max={max(opt_counts)}")
    print(f"Correct answers: min={min(counts)}, max={max(counts)}, avg={sum(counts)/len(counts):.1f}, missing={missing}")
    for r in records[:3]:
        print(f"  {r['id']}: {len(r['options'])} opts, {len(r['correctAnswers'])} correct")


if __name__ == "__main__":
    main()
