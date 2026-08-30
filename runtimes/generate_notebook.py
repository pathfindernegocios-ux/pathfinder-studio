import json
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
TEMPLATE_PATH = BASE_DIR / "templates" / "notebook_template.ipynb"
OUTPUT_DIR = BASE_DIR / "generated"

REPLACEMENTS = {
    "__STATION_ID__": "",
    "__SUPABASE_URL__": "https://sxvgldvnxwjtvqownayr.supabase.co",
    "__SUPABASE_ANON_KEY__": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dmdsZHZueHdqdHZxb3duYXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3OTcwMDUsImV4cCI6MjEwMzM3MzAwNX0.KYClvOPXrVNGT76vizj5og4j7upw6IavO7K--XJkN3Q"
}

def generate(station_id: str):
    OUTPUT_DIR.mkdir(exist_ok=True)

    with open(TEMPLATE_PATH, "r", encoding="utf-8") as f:
        notebook = json.load(f)

    replacements = REPLACEMENTS.copy()
    replacements["__STATION_ID__"] = station_id

    replaced_any = False
    for cell in notebook.get("cells", []):
        if "source" in cell:
            source = "".join(cell["source"])
            for old, new in replacements.items():
                if old in source:
                    source = source.replace(old, new)
                    replaced_any = True
            cell["source"] = source.splitlines(keepends=True)

    if not replaced_any:
        print("⚠️ No se encontraron marcadores en la plantilla. Revisa el archivo.")
        return

    output_path = OUTPUT_DIR / f"notebook_{station_id}.ipynb"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(notebook, f, indent=2)

    print(f"✅ Notebook generado: {output_path}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python generate_notebook.py <STATION_ID>")
        sys.exit(1)

    generate(sys.argv[1])
