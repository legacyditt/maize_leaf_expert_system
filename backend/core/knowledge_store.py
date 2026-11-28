"""Penyimpanan JSON untuk basis pengetahuan dinamis dan riwayat diagnosis.

Memungkinkan Admin mengubah gejala, bobot MB/MD, serta ambang batas CF
tanpa menyentuh kode inti, dan menyimpan log diagnosis untuk evaluasi.
"""

from dataclasses import asdict, dataclass
import csv
import io
import json
from pathlib import Path
from typing import Any

from core.config import BASE_DIR, CF_ACCEPT, CF_DUGAAN

DATA_DIR: Path = BASE_DIR / "data"
KB_PATH: Path = DATA_DIR / "knowledge_base.json"
HISTORY_PATH: Path = DATA_DIR / "diagnosis_history.json"

DEFAULT_FACTS: dict[str, str] = {
    "G1": "Terdapat pustula/benjolan berisi serbuk cokelat kekuningan pada daun",
    "G2": "Daun menguning atau mengering pada serangan berat",
    "G3": "Pustula muncul pada permukaan atas dan bawah daun",
    "G4": "Terdapat lesi memanjang/elips seperti cerutu, hijau keabu-abuan hingga cokelat/tan",
    "G5": "Bercak awal kecil dengan tepi yang tampak basah",
    "G6": "Tidak ditemukan bercak atau lesi pada permukaan daun",
    "G7": "Tidak ditemukan pustula karat maupun lesi hawar pada daun",
}

DEFAULT_MB_MD: dict[str, dict[str, tuple[float, float]]] = {
    "Karat": {
        "G1": (0.90, 0.00),
        "G2": (0.40, 0.00),
        "G3": (0.90, 0.00),
    },
    "Hawar": {
        "G4": (0.90, 0.00),
        "G5": (0.60, 0.00),
    },
    "Sehat": {
        "G6": (0.50, 0.00),
        "G7": (0.50, 0.00),
    },
}

DEFAULT_GOAL_ORDER: tuple[str, ...] = ("Karat", "Hawar", "Sehat")


@dataclass(frozen=True)
class KnowledgeBase:
    """Representasi basis pengetahuan dan parameter CF yang dapat dikonfigurasi."""

    facts: dict[str, str]
    mb_md: dict[str, dict[str, tuple[float, float]]]
    goal_order: tuple[str, ...]
    cf_accept: float
    cf_dugaan: float

    @property
    def rules(self) -> dict[str, list[str]]:
        """Mengembalikan daftar ID gejala per hipotesis sesuai urutan."""
        return {goal: list(symptoms) for goal, symptoms in self.mb_md.items()}


@dataclass(frozen=True)
class DiagnosisLogEntry:
    """Satu baris catatan hasil diagnosis untuk halaman riwayat Admin."""

    timestamp: str
    image_name: str
    cnn_label: str
    cnn_confidence: float
    expert_label: str
    expert_cf: float
    status_match: str
    final_decision: str
    image_url: str | None = None
    cnn_probabilities: dict[str, float] | None = None
    results: list[dict[str, Any]] | None = None


def default_knowledge_base() -> KnowledgeBase:
    """Mengembalikan salinan basis pengetahuan standar dari notebook."""
    return KnowledgeBase(
        facts=dict(DEFAULT_FACTS),
        mb_md={g: {k: tuple(v) for k, v in sym.items()} for g, sym in DEFAULT_MB_MD.items()},
        goal_order=DEFAULT_GOAL_ORDER,
        cf_accept=CF_ACCEPT,
        cf_dugaan=CF_DUGAAN,
    )


def load_knowledge_base(path: Path = KB_PATH) -> KnowledgeBase:
    """Memuat basis pengetahuan dari JSON, atau default bila file belum ada."""
    if not path.exists():
        return default_knowledge_base()

    payload = json.loads(path.read_text(encoding="utf-8"))
    mb_md = {
        goal: {fact_id: (float(pair[0]), float(pair[1])) for fact_id, pair in sym.items()}
        for goal, sym in payload["mb_md"].items()
    }
    return KnowledgeBase(
        facts={str(k): str(v) for k, v in payload["facts"].items()},
        mb_md=mb_md,
        goal_order=tuple(payload.get("goal_order", DEFAULT_GOAL_ORDER)),
        cf_accept=float(payload.get("cf_accept", CF_ACCEPT)),
        cf_dugaan=float(payload.get("cf_dugaan", CF_DUGAAN)),
    )


def save_knowledge_base(kb: KnowledgeBase, path: Path = KB_PATH) -> None:
    """Menyimpan basis pengetahuan ke disk dalam format JSON."""
    path.parent.mkdir(parents=True, exist_ok=True)
    serializable = {
        "facts": kb.facts,
        "mb_md": {
            goal: {fact_id: [pair[0], pair[1]] for fact_id, pair in sym.items()}
            for goal, sym in kb.mb_md.items()
        },
        "goal_order": list(kb.goal_order),
        "cf_accept": kb.cf_accept,
        "cf_dugaan": kb.cf_dugaan,
    }
    path.write_text(json.dumps(serializable, indent=2, ensure_ascii=False), encoding="utf-8")


def load_diagnosis_history(path: Path = HISTORY_PATH) -> list[DiagnosisLogEntry]:
    """Memuat daftar riwayat diagnosis dari JSON."""
    if not path.exists():
        return []
    raw_list = json.loads(path.read_text(encoding="utf-8"))
    return [DiagnosisLogEntry(**item) for item in raw_list]


def append_diagnosis_log(entry: DiagnosisLogEntry, path: Path = HISTORY_PATH) -> None:
    """Menambahkan satu entri diagnosis ke file riwayat JSON."""
    entries = load_diagnosis_history(path)
    entries.insert(0, entry)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps([asdict(item) for item in entries], indent=2, ensure_ascii=False),
        encoding="utf-8",
    )


def clear_diagnosis_history(path: Path = HISTORY_PATH) -> None:
    """Menghapus seluruh catatan riwayat diagnosis."""
    if path.exists():
        path.unlink()


def history_to_csv(entries: list[DiagnosisLogEntry]) -> str:
    """Mengonversi daftar riwayat diagnosis ke string CSV."""
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "timestamp",
            "image_name",
            "cnn_label",
            "cnn_confidence",
            "expert_label",
            "expert_cf",
            "status_match",
            "final_decision",
        ]
    )
    for item in entries:
        writer.writerow(
            [
                item.timestamp,
                item.image_name,
                item.cnn_label,
                f"{item.cnn_confidence:.3f}",
                item.expert_label,
                f"{item.expert_cf:.3f}",
                item.status_match,
                item.final_decision,
            ]
        )
    return buffer.getvalue()
