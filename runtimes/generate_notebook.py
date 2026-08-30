#!/usr/bin/env python3
"""
Generador de notebooks personalizados para Pathfinder Studio.

Uso:
    python runtimes/generate_notebook.py <STATION_ID>

Opciones (variables de entorno opcionales):
    SUPABASE_URL: URL de Supabase (si no se define, se usa el marcador).
    SUPABASE_ANON_KEY: Clave anon de Supabase (si no se define, se usa el marcador).

Ejemplo:
    export SUPABASE_URL="https://tu-proyecto.supabase.co"
    export SUPABASE_ANON_KEY="tu-anon-key"
    python runtimes/generate_notebook.py PF-123ABC
"""

import os
import sys
from pathlib import Path

# Rutas
BASE_DIR = Path(__file__).resolve().parent
TEMPLATE_PATH = BASE_DIR / "templates" / "notebook_template.ipynb"
OUTPUT_DIR = BASE_DIR / "generated"

def load_template():
    """Carga el notebook plantilla."""
    if not TEMPLATE_PATH.exists():
        raise FileNotFoundError(f"No se encontró la plantilla: {TEMPLATE_PATH}")
    with open(TEMPLATE_PATH, "r", encoding="utf-8") as f:
        return f.read()

def replace_markers(content: str, station_id: str) -> str:
    """Reemplaza marcadores en la plantilla por valores reales o marcadores seguros."""
    supabase_url = os.environ.get("SUPABASE_URL", "__SUPABASE_URL__")
    supabase_anon_key = os.environ.get("SUPABASE_ANON_KEY", "__SUPABASE_ANON_KEY__")

    replacements = {
        "__STATION_ID__": station_id,
        "__SUPABASE_URL__": supabase_url,
        "__SUPABASE_ANON_KEY__": supabase_anon_key,
    }

    for marker, value in replacements.items():
        content = content.replace(marker, value)

    return content

def generate(station_id: str):
    """Genera un notebook personalizado para un station_id dado."""
    content = load_template()
    personalized = replace_markers(content, station_id)

    OUTPUT_DIR.mkdir(exist_ok=True)
    output_path = OUTPUT_DIR / f"notebook_{station_id}.ipynb"

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(personalized)

    print(f"✅ Notebook generado: {output_path}")
    return output_path

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python runtimes/generate_notebook.py <STATION_ID>")
        sys.exit(1)

    station = sys.argv[1]
    generate(station)
