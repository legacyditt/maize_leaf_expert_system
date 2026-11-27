"""Manajemen state sesi Streamlit (`st.session_state`) untuk mode User & Admin."""

import streamlit as st

from core.cnn_predictor import PredictionResult

_KEY_ROLE = "active_role"
_KEY_STEP = "current_step"
_KEY_ADMIN_STEP = "admin_step"
_KEY_KNOWN = "known"
_KEY_CNN_RESULT = "cnn_result"
_KEY_IMAGE_SIG = "image_signature"
_KEY_IMAGE_BYTES = "image_bytes"
_KEY_IMAGE_NAME = "image_name"
_KEY_USE_CNN = "use_cnn_guide"
_KEY_LOGGED_SIG = "history_logged_sig"


def init_state() -> None:
    """Inisialisasi seluruh kunci session_state jika belum ada."""
    st.session_state.setdefault(_KEY_ROLE, "user")
    st.session_state.setdefault(_KEY_STEP, 1)
    st.session_state.setdefault(_KEY_ADMIN_STEP, 1)
    st.session_state.setdefault(_KEY_KNOWN, {})
    st.session_state.setdefault(_KEY_CNN_RESULT, None)
    st.session_state.setdefault(_KEY_IMAGE_SIG, None)
    st.session_state.setdefault(_KEY_IMAGE_BYTES, None)
    st.session_state.setdefault(_KEY_IMAGE_NAME, None)
    st.session_state.setdefault(_KEY_USE_CNN, True)
    st.session_state.setdefault(_KEY_LOGGED_SIG, None)


def get_active_role() -> str:
    """Mengembalikan peran aktif ('user' atau 'admin')."""
    return str(st.session_state.get(_KEY_ROLE, "user"))


def set_active_role(role: str) -> None:
    """Berpindah antara UI User dan UI Admin."""
    st.session_state[_KEY_ROLE] = role


def get_current_step() -> int:
    """Mengembalikan nomor halaman aktif User (1, 2, atau 3)."""
    return int(st.session_state.get(_KEY_STEP, 1))


def go_to_step(step: int) -> None:
    """Berpindah ke halaman User target (1: CNN, 2: Pakar, 3: Hasil)."""
    st.session_state[_KEY_STEP] = step


def get_admin_step() -> int:
    """Mengembalikan nomor halaman aktif Admin (1, 2, atau 3)."""
    return int(st.session_state.get(_KEY_ADMIN_STEP, 1))


def go_to_admin_step(step: int) -> None:
    """Berpindah ke halaman Admin target (1: KB, 2: Parameter & Model, 3: Riwayat)."""
    st.session_state[_KEY_ADMIN_STEP] = step


def set_use_cnn_guide(enabled: bool) -> None:
    """Mengatur apakah sistem pakar memakai target prediksi CNN."""
    st.session_state[_KEY_USE_CNN] = enabled


def is_using_cnn_guide() -> bool:
    """Mengembalikan True jika sistem pakar dipandu oleh hasil CNN."""
    return bool(st.session_state.get(_KEY_USE_CNN, True))


def retry_questionnaire() -> None:
    """Mengosongkan jawaban gejala dan kembali ke halaman tanya-jawab."""
    st.session_state[_KEY_KNOWN] = {}
    st.session_state[_KEY_LOGGED_SIG] = None
    st.session_state[_KEY_STEP] = 2


def start_new_diagnosis() -> None:
    """Mereset seluruh sesi (gambar, prediksi, jawaban) dan kembali ke tahap 1."""
    st.session_state[_KEY_KNOWN] = {}
    st.session_state[_KEY_CNN_RESULT] = None
    st.session_state[_KEY_IMAGE_SIG] = None
    st.session_state[_KEY_IMAGE_BYTES] = None
    st.session_state[_KEY_IMAGE_NAME] = None
    st.session_state[_KEY_USE_CNN] = True
    st.session_state[_KEY_LOGGED_SIG] = None
    st.session_state[_KEY_STEP] = 1


def set_uploaded_image(signature: str, name: str, raw_bytes: bytes, result: PredictionResult) -> None:
    """Menyimpan gambar dan hasil CNN baru jika file berbeda."""
    if st.session_state.get(_KEY_IMAGE_SIG) != signature:
        st.session_state[_KEY_IMAGE_SIG] = signature
        st.session_state[_KEY_IMAGE_NAME] = name
        st.session_state[_KEY_IMAGE_BYTES] = raw_bytes
        st.session_state[_KEY_CNN_RESULT] = result
        st.session_state[_KEY_KNOWN] = {}
        st.session_state[_KEY_LOGGED_SIG] = None


def get_cnn_result() -> PredictionResult | None:
    """Mengambil hasil prediksi CNN aktif dari session_state."""
    return st.session_state.get(_KEY_CNN_RESULT)


def get_image_signature() -> str | None:
    """Mengambil signature file gambar terakhir yang diproses."""
    return st.session_state.get(_KEY_IMAGE_SIG)


def get_image_preview() -> tuple[bytes | None, str | None]:
    """Mengembalikan bytes dan nama file gambar tersimpan agar tetap tampil saat navigasi."""
    return st.session_state.get(_KEY_IMAGE_BYTES), st.session_state.get(_KEY_IMAGE_NAME)


def get_known_answers() -> dict[str, str]:
    """Mengembalikan kamus jawaban gejala yang sudah diisi user."""
    return st.session_state.get(_KEY_KNOWN, {})


def record_answer(fact_id: str, answer: str) -> None:
    """Menyimpan jawaban YA/TIDAK untuk satu ID gejala."""
    known = dict(st.session_state.get(_KEY_KNOWN, {}))
    known[fact_id] = answer
    st.session_state[_KEY_KNOWN] = known


def mark_history_logged(session_sig: str) -> bool:
    """Mengembalikan True jika sesi ini baru pertama kali dicatat ke riwayat."""
    if st.session_state.get(_KEY_LOGGED_SIG) == session_sig:
        return False
    st.session_state[_KEY_LOGGED_SIG] = session_sig
    return True
