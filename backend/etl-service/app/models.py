import pathlib
from dataclasses import dataclass, field


@dataclass
class QuestionDto:
    """Uma pergunta extraída do seed (JSON ou docx convertido)."""
    title: str
    options: list[str] = field(default_factory=list)
    correct_index: int = 0
    difficulty: str = "unknown"
    topic: str = "java"

    def regex_requirements(self) -> list[str]:
        """Uso exigido (for/while/if/switch) — o verification-service (Java)
        também aplica essas regras nos nódulos `node` da resposta."""
        found = []
        for kw in ("for", "while", "do", "if", "switch"):
            if kw in self.title.lower():
                found.append(kw)
        return found

    def to_payload(self) -> dict:
        return {
            "id": self._stable_id(),
            "title": self.title,
            "options": self.options,
            "correctIndex": self.correct_index,
            "difficulty": self.difficulty,
            "topic": self.topic,
            "requiredUsage": self.regex_requirements(),
        }

    def _stable_id(self) -> str:
        import hashlib

        return hashlib.sha1(self.title.encode("utf-8")).hexdigest()[:16]


@dataclass
class SeedResult:
    """Resultado de um batch de importação."""
    imported: int = 0
    rejected: int = 0
    source_files: list[str] = field(default_factory=list)

    def to_payload(self) -> dict:
        return {
            "imported": self.imported,
            "rejected": self.rejected,
            "sources": self.source_files,
        }


@dataclass
class ImportRequest:
    seed_path: str | None = None
    dry_run: bool = False


@dataclass
class ImportResponse:
    imported: int = 0
    rejected: int = 0
    source_files: list[str] = field(default_factory=list)
    dry_run: bool = False
