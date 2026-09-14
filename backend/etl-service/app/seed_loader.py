import json
import os
import pathlib
import re

from app.models import QuestionDto, SeedResult

SEED_DIR_ENV = os.getenv("SEED_DIR")
SEED_DIR: pathlib.Path = pathlib.Path(SEED_DIR_ENV).resolve() if SEED_DIR_ENV else pathlib.Path(__file__).resolve().parent.parent / "data" / "seed"
UPLOAD_DIR_ENV = os.getenv("UPLOAD_DIR")
UPLOAD_DIR: pathlib.Path = pathlib.Path(UPLOAD_DIR_ENV).resolve() if UPLOAD_DIR_ENV else pathlib.Path(__file__).resolve().parent.parent / "data" / "upload-seed"
SEED_JSON_NAME = "questions-seed.json"


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
        title = it.get("questionBody") or it.get("title") or it.get("question") or ""
        q = QuestionDto(
            title=title,
            options=[str(o) for o in opts],
            correct_index=int(it.get("correctIndex", it.get("correct", 0))),
            difficulty=it.get("difficulty", "unknown"),
            topic=it.get("topic", "java"),
            question_type=it.get("type", "PRACTICAL"),
            required_usage=it.get("requiredUsage"),
            starter_code=it.get("starterCode"),
        )
        out.append(q)
    return out


_NOISE_MARKS = (
    "instituto federal", "campus", "semestre:", "professor:", "estudante:", "curso:",
    "projeto de extens", "coordenador", "estudantes bolsistas", "aula:", "licença:",
    "creative commons", "boa prova", "easter egg",
)
_VERB_HINTS = (
    "imprimir", "converter", "solucionar", "escolher", "computar", "trocar", "corrigir",
    "dado", "dada", "testar", "multiplicar", "dividir", "elevar", "implemente",
    "implementar", "criar", "qual o retorno", "o programa abaixo", "calcular",
    "somar", "subtrair", "escreva", "determinar", "informar", "verificar",
    "imprima", "escrever", "analisar", "ordenar", "solicitar", "receber",
)
_SECTION_TOPIC_MAP = {
    "arrays": "ARRAYS",
    "vetor": "VETORES",
    "tipos": "TIPOS_CRIADOS_PELO_PROGRAMADOR",
    "corre": "LACOS",
    "execu": "EXECUCAO_CONDICIONAL",
    "opera": "OPERADORES_TIPOS_E_VARIAVEIS",
    "lacos": "LACOS",
    "condi": "EXECUCAO_CONDICIONAL",
}


def _is_noise_line(line: str) -> bool:
    lower = line.lower().strip()
    if lower.startswith(("http://", "https://")):
        return True
    return any(lower.startswith(mark) for mark in _NOISE_MARKS)


def _looks_like_code(line: str) -> bool:
    stripped = line.strip()
    if not stripped:
        return False
    if stripped.startswith(("class ", "function ", "}", "{", "interface ", "enum ")):
        return True
    return line.startswith((" ", "\t")) and (
        stripped.endswith((";", ":", "}")) or " = " in stripped or "(" in stripped
    )


def _infer_section_topic(text: str) -> str | None:
    lower = text.lower()
    for key, topic in _SECTION_TOPIC_MAP.items():
        if key in lower:
            return topic
    return None


def _parse_exercise_seed(text: str) -> list[QuestionDto]:
    """Extrai questões dos docx de exercícios/avaliações reais:
    bullets de exercício, seções '[Tema]', itens '(nota) texto' e blocos de código
    como starterCode da questão que precede o bloco."""
    questions: list[QuestionDto] = []
    last: QuestionDto | None = None
    current_topic: str | None = None
    current_difficulty: str | None = None
    pending_code: list[str] = []

    def attach_pending_code() -> None:
        nonlocal last, pending_code
        if pending_code and last is not None:
            last.starter_code = "\n".join(pending_code).strip()
        pending_code = []

    def flush_question(title: str) -> None:
        nonlocal last
        attach_pending_code()
        last = QuestionDto(
            title=title.rstrip(";").strip(),
            difficulty=current_difficulty or "unknown",
            topic=current_topic or "unknown",
        )
        questions.append(last)

    for raw in text.splitlines():
        line = raw.rstrip()
        if not line.strip():
            continue

        if _is_noise_line(line):
            attach_pending_code()
            continue
        if _looks_like_code(line):
            pending_code.append(line)
            continue

        stripped = line.strip()

        if stripped.endswith(":"):
            if stripped.startswith("["):
                current_topic = _infer_section_topic(stripped)
            continue

        m = re.match(r"^exercícios de nível\s*(\d+)", stripped, re.IGNORECASE)
        if m:
            lvl = int(m.group(1))
            current_difficulty = "EASY" if lvl <= 1 else ("MEDIUM" if lvl == 2 else "HARD")
            continue

        if stripped.startswith("["):
            current_topic = _infer_section_topic(stripped)
            body = re.sub(r"^\[[^\]]+\]\s*", "", stripped).strip()
            body = re.sub(r"^\(?\d+(?:\.\d+)\)?\s*", "", body).strip()
            if body:
                flush_question(body)
            continue

        m = re.match(r"^\(?(\d+(?:\.\d+))\)?\s*(.+)$", stripped)
        if m:
            flush_question(m.group(2).strip())
            continue

        if _starts_with_verb(stripped) or stripped.endswith((";", ".")):
            if not _is_dica_line(stripped):
                flush_question(stripped)
            continue

        if _is_dica_line(stripped):
            if last is not None:
                last = QuestionDto(
                    title=(last.title + " " + stripped).strip(),
                    difficulty=last.difficulty,
                    topic=last.topic,
                    starter_code=last.starter_code,
                )
                questions[-1] = last
            continue

    attach_pending_code()
    return [q for q in questions if q.title]


def _starts_with_verb(text: str) -> bool:
    lower = text.lower().lstrip("*+-")
    return any(lower.startswith(v) for v in _VERB_HINTS)


def _is_dica_line(text: str) -> bool:
    lower = text.lower()
    return lower.startswith(("dica:", "formato:", "exemplo:", "se ", "use ", "uso:"))


def _parse_text_seed(text: str) -> list[QuestionDto]:
    """Suporta dois formatos:
    1) blocos 'N)' com opções 'a)..' (múltipla escolha)
    2) docx de exercícios/avaliações (bullets, seções '[Tema]', itens '(nota)').
    O formato 1 só é usado se o texto realmente possui linhas 'N)' numeradas.
    """
    has_numbered = any(re.match(r"^\d+[.)]\s", ln.strip()) for ln in text.splitlines())
    if has_numbered:
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
        if out:
            return out

    return _parse_exercise_seed(text)


def _docx_to_text(path: pathlib.Path) -> str:
    from docx import Document

    doc = Document(str(path))
    return "\n".join(p.text for p in doc.paragraphs)


def _pdf_to_text(path: pathlib.Path) -> str:
    from pypdf import PdfReader

    reader = PdfReader(str(path))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def load_seed_from_disk(seed_path: str | None = None) -> tuple[SeedResult, list[QuestionDto]]:
    target = pathlib.Path(seed_path).resolve() if seed_path else SEED_DIR
    files: list[pathlib.Path]
    if target.is_dir():
        files = sorted(target.iterdir())
    else:
        files = [target]

    res = SeedResult()
    all_questions: list[QuestionDto] = []
    for f in files:
        if not f.is_file():
            continue
        try:
            if f.suffix.lower() == ".json":
                qs = _parse_json(f)
            elif f.suffix.lower() in (".docx", ".doc"):
                qs = _parse_text_seed(_docx_to_text(f))
            elif f.suffix.lower() == ".pdf":
                qs = _parse_text_seed(_pdf_to_text(f))
            else:
                continue
            res.imported += len(qs)
            all_questions.extend(qs)
            res.source_files.append(f.name)
        except Exception as exc:
            res.rejected += 1
            print(f"[seed_loader] falha em {f.name}: {exc}")
    res.source_files.sort()
    return res, all_questions


def load_json_seed() -> tuple[SeedResult, list[QuestionDto]]:
    """Carrega APENAS o questions-seed.json (startup não parseia docx/pdf)."""
    target = SEED_DIR / SEED_JSON_NAME
    res = SeedResult()
    if not target.is_file():
        print(f"[seed_loader] {SEED_JSON_NAME} não encontrado em {SEED_DIR}")
        return res, []

    try:
        questions = _parse_json(target)
        res.imported = len(questions)
        res.source_files = [target.name]
        return res, questions
    except Exception as exc:
        res.rejected = 1
        print(f"[seed_loader] falha ao carregar {target.name}: {exc}")
        return res, []


def load_seed_questions_from_json() -> list[dict]:
    path = SEED_DIR / SEED_JSON_NAME
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return []
    items = data.get("questions", []) if isinstance(data, dict) else data
    return items if isinstance(items, list) else []


VALID_DIFFICULTIES = {"EASY", "MEDIUM", "HARD"}
VALID_TOPICS = {
    "OPERADORES_TIPOS_E_VARIAVEIS",
    "EXECUCAO_CONDICIONAL",
    "OPERADORES_LOGICOS",
    "LACOS",
    "SUBPROGRAMAS",
    "VETORES",
    "ARRAYS",
    "TIPOS_CRIADOS_PELO_PROGRAMADOR",
}


def normalize_question(q: QuestionDto) -> QuestionDto:
    return QuestionDto(
        title=q.title,
        options=q.options,
        correct_index=q.correct_index,
        difficulty=q.difficulty if q.difficulty in VALID_DIFFICULTIES else "MEDIUM",
        topic=q.topic if q.topic in VALID_TOPICS else "OPERADORES_TIPOS_E_VARIAVEIS",
        question_type=q.question_type,
        required_usage=q.required_usage,
        starter_code=q.starter_code,
    )


def _question_to_seed_json(q: QuestionDto) -> dict:
    q = normalize_question(q)
    entry = {
        "questionBody": q.title,
        "type": q.question_type,
        "difficulty": q.difficulty,
        "requiredUsage": q.required_usage,
        "topic": q.topic,
    }
    if q.starter_code is not None:
        entry["starterCode"] = q.starter_code
    return entry


def persist_questions_to_seed_json(questions: list[QuestionDto]) -> int:
    """Mescla as questões extraídas no questions-seed.json (dedup por questionBody)
    e retorna quantas foram efetivamente adicionadas."""
    current = load_seed_questions_from_json()
    current_bodies = {(q.get("questionBody") or "").strip() for q in current}
    added = 0
    seen: set[str] = set()
    for q in questions:
        body = (q.title or "").strip()
        if not body or body in current_bodies or body in seen:
            continue
        seen.add(body)
        current.append(_question_to_seed_json(q))
        added += 1

    if added == 0:
        return 0

    payload = {"questions": current}
    target = SEED_DIR / SEED_JSON_NAME
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[seed_loader] {added} questão(ões) adicionada(s) ao {target.name}; total: {len(current)}")
    return added
