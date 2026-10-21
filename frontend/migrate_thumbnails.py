import os
import io
import subprocess
import tempfile
import sys
from PIL import Image
import boto3
from supabase import create_client

# ── VALORES FIJOS ──
SUPABASE_URL = "https://sxvgldvnxwjtvqownayr.supabase.co"
R2_BUCKET  = "pathfinder-generations"

print("=== CONFIGURACIÓN DE MIGRACIÓN ===")
print(f"Supabase URL: {SUPABASE_URL}")
print(f"R2 Bucket:    {R2_BUCKET}")
print()

R2_ACCOUNT = input("R2 Account ID (32 caracteres hex, ej. a1b2c3...): ").strip()

# 🔒 CANDADO: Verificar que no hayan pegado el API Token
if R2_ACCOUNT.startswith("cfat_") or len(R2_ACCOUNT) != 32:
    print("\n❌ ERROR: El valor ingresado NO es un Account ID válido.")
    print("   - El Account ID tiene 32 caracteres hexadecimales (letras a-f y números).")
    print("   - Empieza con 'cfat_' es un API Token, NO un Account ID.")
    print("   - Lo encuentras en la URL de tu dashboard o en 'Account Details' en R2.")
    sys.exit(1)

SUPABASE_KEY = input("Supabase Service Role Key: ").strip()
R2_ACCESS    = input("R2 Access Key ID: ").strip()
R2_SECRET    = input("R2 Secret Access Key: ").strip()

# ── VALIDACIÓN ──
for name, val in [("SUPABASE_KEY", SUPABASE_KEY), ("R2_ACCESS", R2_ACCESS), ("R2_SECRET", R2_SECRET)]:
    if not val:
        print(f"❌ {name} está vacío. Abortando.")
        sys.exit(1)

print()
print("Conectando a Supabase...")
try:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Supabase OK")
except Exception as e:
    print(f"❌ Supabase falló: {e}")
    sys.exit(1)

print("Conectando a R2...")
try:
    s3 = boto3.client(
        's3',
        endpoint_url=f'https://{R2_ACCOUNT}.r2.cloudflarestorage.com',
        aws_access_key_id=R2_ACCESS,
        aws_secret_access_key=R2_SECRET,
        region_name='auto'
    )
    # Verificación rápida
    s3.list_objects_v2(Bucket=R2_BUCKET, MaxKeys=1)
    print("✅ R2 OK")
except Exception as e:
    print(f"❌ R2 falló: {e}")
    sys.exit(1)

print()

def download_r2(key):
    res = s3.get_object(Bucket=R2_BUCKET, Key=key)
    return res['Body'].read()

def upload_r2(key, body):
    s3.put_object(Bucket=R2_BUCKET, Key=key, Body=body, ContentType='image/png')

def process_image(data):
    img = Image.open(io.BytesIO(data))
    img.thumbnail((512, 512), Image.Resampling.LANCZOS)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()

def process_video(data):
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp_in:
        tmp_in.write(data)
        tmp_in_path = tmp_in.name
    tmp_out_path = tmp_in_path.replace(".mp4", ".jpg")
    try:
        subprocess.run(["ffmpeg", "-y", "-i", tmp_in_path, "-vframes", "1", "-f", "image2", tmp_out_path],
                       capture_output=True, check=True)
        img = Image.open(tmp_out_path)
        img.thumbnail((512, 512), Image.Resampling.LANCZOS)
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        return buffer.getvalue()
    finally:
        if os.path.exists(tmp_in_path): os.remove(tmp_in_path)
        if os.path.exists(tmp_out_path): os.remove(tmp_out_path)

def main():
    print("Buscando creaciones sin thumbnail...")
    res = supabase.table("creations").select("id, storage_key, media_type, metadata").is_("metadata->>thumb_key", "null").execute()

    if not res.data:
        print("✅ Todo tiene thumbnail. Nada que migrar.")
        return

    print(f"🔍 Encontrados {len(res.data)} archivos sin thumbnail.\n")

    for i, row in enumerate(res.data):
        c_id = row['id']
        storage_key = row['storage_key']
        media_type = row['media_type']
        meta = row.get('metadata') or {}

        print(f"[{i+1}/{len(res.data)}] {c_id} ({media_type})...")

        try:
            data = download_r2(storage_key)

            if media_type == 'image':
                thumb_data = process_image(data)
            elif media_type == 'video':
                thumb_data = process_video(data)
            else:
                print("  ⚠️ Audio, saltando.")
                continue

            filename = storage_key.split('/')[-1]
            thumb_key = f"creations/{c_id.split('-')[0]}/thumb_{filename}.png"
            upload_r2(thumb_key, thumb_data)

            new_meta = {**meta, "thumb_key": thumb_key}
            supabase.table("creations").update({"metadata": new_meta}).eq("id", c_id).execute()

            print(f"  ✅ {thumb_key}")

        except Exception as e:
            print(f"  ❌ Error: {e}")

    print("\n🎉 Migración completada.")

if __name__ == "__main__":
    main()
