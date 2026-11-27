"""Konfigurasi dan konstanta global aplikasi diagnosis daun jagung."""

from pathlib import Path

BASE_DIR: Path = Path(__file__).resolve().parent.parent
MODEL_PATH: Path = BASE_DIR / "models" / "maize_leaf_model.keras"

IMG_SIZE: int = 256
CLASS_NAMES: tuple[str, ...] = ("Hawar", "Karat", "Sehat")

CF_ACCEPT: float = 0.60
CF_DUGAAN: float = 0.30

YA: str = "ya"
TIDAK: str = "tidak"
ANS_TEXT: dict[str, str] = {YA: "YA", TIDAK: "TIDAK"}

