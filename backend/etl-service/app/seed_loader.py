import json
import pathlib
import re

from app.models import QuestionDto, SeedResult

SEED_DIR: pathlib.Path = pathlib.Path(__file__).resolve().parent.parent / "data" / "seed"


def _harvest_requirements(title: str) -> list[str]:
    found = []
    for kw in ("for", "while", "do", "if", "switch", "recurs"):
        if re.search(rf"\b{kw}\b", title, re.IGNORECASE):
            found.append(kw)
    return found


def _parse_block(lines: list[str]) -> QuestionDto | None:
    if not lines:
        return None
    title = lines[0].strip()
    m = re.match(r"^\s*(?:\d+[.)]|[A-Z][).:])\s*(.+)$", title)
    if m:
        title = m.group(1)
    opts, correct = [], -1
    for ln in lines[1:]:
        m = re.match(r"^\s*([*+-]?)\s*([a-zA-Z])[).:]\s*(.+)$", ln)
        if not m:
            continue
        mark, _lbl, text = m.group(1), m.group(2), m.group(3)
        if mark in ("*", "+", "-"):
            correct = len(opts)
        opts.append(text.strip())
    if not title or len(opts) < 2:
        return None
    q = QuestionDto(title=title, options=opts, correct_index=max(correct, 0))
    return q


def _parse_json(path: pathlib.Path) -> list[QuestionDto]:
    raw = json.loads(path.read_text(encoding="utf-8"))
    items = raw if isinstance(raw, list) else raw.get("questions", raw.get("items", []))
    out = []
    for it in items:
        opts = it.get("options", it.get("alternatives", []))
        q = QuestionDto(
            title=it.get("title", it.get("question", "")),
            options=[str(o) for o in opts],
            correct_index=int(it.get("correctIndex", it.get("correct", 0))),
            difficulty=it.get("difficulty", "unknown"),
            topic=it.get("topic", "java"),
        )
        out.append(q)
    return out


def _parse_text_seed(text: str) -> list[QuestionDto]:
    """divide em blocos de questão por linha 'N)' ; dentro do bloco, opções 'a)..'."""
    blocks: list[list[str]] = [[]]
    for raw in text.splitlines():
        ln = raw.strip()
        if not ln:
            continue
        if re.match(r"^\d+[.)]\s", ln):
            blocks.append([ln])
        else:
            blocks[-1].append(ln)
    out: list[QuestionDto] = []
    for blk in blocks:
        q = _parse_block(blk)
        if q:
            out.append(q)
    return out


def _docx_to_text(path: pathlib.Path) -> str:
    from docx import Document

    doc = Document(str(path))
    return "\n".join(p.text for p in doc.paragraphs)


def load_seed_from_disk(seed_path: str | None = None) -> SeedResult:
    target = pathlib.Path(seed_path).resolve() if seed_path else SEED_DIR
    files: list[pathlib.Path]
    if target.is_dir():
        files = sorted(target.iterdir())
    else:
        files = [target]

    res = SeedResult()
    for f in files:
        if not f.is_file():
            continue
        try:
            if f.suffix.lower() == ".json":
                qs = _parse_json(f)
            elif f.suffix.lower() in (".docx", ".doc"):
                qs = _parse_text_seed(_docx_to_text(f))
            else:
                continue
            res.imported += len(qs)
            res.source_files.append(f.name)
        except Exception as exc:
            res.rejected += 1
            print(f"[seed_loader] falha em {f.name}: {exc}")
    res.source_files.sort()
    return res
