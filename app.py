"""Entry point aplikasi Streamlit MaizeCare AI (Mode User & Admin)."""

import streamlit as st

from ui.admin_components import render_admin_history, render_admin_kb, render_admin_params
from ui.components import render_page_cnn, render_page_expert, render_page_result
from ui.state import (
    get_active_role,
    get_admin_step,
    get_current_step,
    go_to_admin_step,
    go_to_step,
    init_state,
    set_active_role,
)
from ui.styles import inject_maize_styles, render_navbar


def _render_top_navigation(role: str, active_step: int) -> None:
    """Merender bar navigasi ringkas antar tahap dan pengalih peran User/Admin."""
    if role == "admin":
        c1, c2, c3, c_switch = st.columns([1, 1, 1, 0.8])
        if c1.button("1. Basis Pengetahuan", use_container_width=True, type="primary" if active_step == 1 else "secondary"):
            go_to_admin_step(1)
            st.rerun()
        if c2.button("2. Parameter & Model", use_container_width=True, type="primary" if active_step == 2 else "secondary"):
            go_to_admin_step(2)
            st.rerun()
        if c3.button("3. Riwayat Diagnosis", use_container_width=True, type="primary" if active_step == 3 else "secondary"):
            go_to_admin_step(3)
            st.rerun()
        if c_switch.button("↗ Mode User", use_container_width=True):
            set_active_role("user")
            st.rerun()
    else:
        c1, c2, c3, c_switch = st.columns([1, 1, 1, 0.8])
        if c1.button("1. Citra CNN", use_container_width=True, type="primary" if active_step == 1 else "secondary"):
            go_to_step(1)
            st.rerun()
        if c2.button("2. Gejala Pakar", use_container_width=True, type="primary" if active_step == 2 else "secondary"):
            go_to_step(2)
            st.rerun()
        if c3.button("3. Hasil Diagnosis", use_container_width=True, type="primary" if active_step == 3 else "secondary"):
            go_to_step(3)
            st.rerun()
        if c_switch.button("⚙ Mode Admin", use_container_width=True):
            set_active_role("admin")
            st.rerun()


def main() -> None:
    """Mengatur konfigurasi halaman, tema Maize, dan routing User/Admin."""
    st.set_page_config(
        page_title="MaizeCare AI — Diagnosis Daun Jagung",
        page_icon="🌽",
        layout="wide",
        initial_sidebar_state="collapsed",
    )
    init_state()
    inject_maize_styles()

    role = get_active_role()
    active_step = get_admin_step() if role == "admin" else get_current_step()

    render_navbar(role, active_step)
    _render_top_navigation(role, active_step)

    if role == "admin":
        if active_step == 1:
            render_admin_kb()
        elif active_step == 2:
            render_admin_params()
        else:
            render_admin_history()
    else:
        if active_step == 1:
            render_page_cnn()
        elif active_step == 2:
            render_page_expert()
        else:
            render_page_result()


if __name__ == "__main__":
    main()
