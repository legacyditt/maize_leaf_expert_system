"""Styling CSS dan aset SVG bertema Maize (jagung) untuk antarmuka Streamlit."""

import streamlit as st

_MAIZE_LEAF_SVG = (
    '<svg width="28" height="32" viewBox="0 0 28 32" fill="none" xmlns="http://www.w3.org/2000/svg">'
    '<path d="M14 2C20 8 24 16 22 26C16 28 8 24 4 16C2 10 8 4 14 2Z" fill="#FACC15" stroke="#FEF08A" stroke-width="1.6"/>'
    '<path d="M14 6V24M14 12L19 9M14 17L9 14" stroke="#14532D" stroke-width="1.6" stroke-linecap="round"/>'
    '</svg>'
)

_CUSTOM_CSS = """
<style>
  header[data-testid="stHeader"] { display: none; }
  section[data-testid="stSidebar"] { display: none; }
  .block-container {
    padding-top: 1.25rem !important;
    padding-bottom: 3rem !important;
    max-width: 1020px !important;
  }

  .maize-navbar {
    background: #14532D;
    border-radius: 14px;
    padding: 14px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 12px;
    box-shadow: 0 4px 14px rgba(20, 83, 45, 0.12);
    flex-wrap: wrap;
  }
  .maize-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #FEFCE8;
    font-weight: 700;
    font-size: 1.05rem;
  }
  .maize-steps {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .maize-pill {
    padding: 5px 13px;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 600;
    color: #BBF7D0;
  }
  .maize-pill.done { color: #86EFAC; }
  .maize-pill.active {
    background: #FACC15;
    color: #14532D;
    font-weight: 700;
  }

  .maize-hero {
    text-align: center;
    margin: 14px 0 22px 0;
  }
  .maize-tag {
    color: #B45309;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  .maize-title {
    color: #1C2419;
    font-size: 1.85rem;
    font-weight: 800;
    margin: 0 0 6px 0;
  }
  .maize-sub {
    color: #576351;
    font-size: 0.95rem;
    margin: 0;
  }

  .maize-pred-box {
    background: #FEF3C7;
    border: 1.5px solid #F59E0B;
    border-radius: 12px;
    padding: 14px 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
  }
  .maize-pred-box.sehat {
    background: #DCFCE7;
    border-color: #16A34A;
  }
  .maize-pred-label {
    font-size: 1.2rem;
    font-weight: 800;
    color: #92400E;
  }
  .maize-pred-box.sehat .maize-pred-label { color: #14532D; }
  .maize-pred-conf {
    font-size: 1.1rem;
    font-weight: 800;
    color: #B45309;
  }
  .maize-pred-box.sehat .maize-pred-conf { color: #15803D; }

  .maize-ctx-bar {
    background: #FEF3C7;
    border: 1px solid #F59E0B;
    border-radius: 10px;
    padding: 11px 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #92400E;
    font-size: 0.88rem;
    font-weight: 600;
    margin-bottom: 16px;
  }

  .maize-cf-meter {
    background: #FFFFFF;
    border: 1px solid #E5E0C8;
    border-radius: 10px;
    padding: 12px 18px;
    color: #576351;
    font-size: 0.88rem;
    font-weight: 600;
    margin-top: 12px;
  }

  .maize-trace-box {
    background: #142419;
    border-radius: 12px;
    padding: 18px 20px;
    margin: 14px 0 18px 0;
  }
  .maize-trace-title {
    color: #FACC15;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    margin-bottom: 10px;
  }
  .maize-trace-pre {
    color: #F1F5F9 !important;
    background: transparent !important;
    border: none !important;
    padding: 0 !important;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace !important;
    font-size: 0.85rem !important;
    line-height: 1.65 !important;
    white-space: pre-wrap !important;
    margin: 0 !important;
  }
</style>
"""


def inject_maize_styles() -> None:
    """Menyuntikkan tema CSS Maize dan menyembunyikan chrome bawaan."""
    st.markdown(_CUSTOM_CSS, unsafe_allow_html=True)


def render_navbar(role: str, active_step: int) -> None:
    """Merender navbar MaizeCare AI sesuai peran (User atau Admin) dan tahap aktif."""
    if role == "admin":
        brand_title = "MaizeCare AI — Admin Panel"
        steps = [
            (1, "1. Basis Pengetahuan"),
            (2, "2. Parameter & Model"),
            (3, "3. Riwayat Diagnosis"),
        ]
    else:
        brand_title = "MaizeCare AI — Diagnosis Daun Jagung"
        steps = [
            (1, "1. Citra CNN"),
            (2, "2. Gejala Pakar"),
            (3, "3. Hasil Diagnosis"),
        ]

    pills_html = []
    for step_num, label in steps:
        if role == "user" and step_num < active_step:
            cls = "maize-pill done"
            text = f"✓ {label}"
        elif step_num == active_step:
            cls = "maize-pill active"
            text = label
        else:
            cls = "maize-pill"
            text = label
        pills_html.append(f'<span class="{cls}">{text}</span>')

    navbar_html = (
        '<div class="maize-navbar">'
        f'<div class="maize-brand">{_MAIZE_LEAF_SVG}<span>{brand_title}</span></div>'
        f'<div class="maize-steps">{"".join(pills_html)}</div>'
        '</div>'
    )
    st.html(navbar_html)
