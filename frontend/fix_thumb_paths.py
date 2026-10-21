import os
import sys
from supabase import create_client
import boto3

# ── VALORES FIJOS ──
SUPABASE_URL = "https://sxvgldvnxwjtvqownayr.supabase.co"
R2_BUCKET  = "pathfinder-generations"

print("=== REPARACIÓN DE RUTAS DE THUMBNAILS ===")
R2_ACCOUNT = input("R2 Account ID (32 caracteres hex): ").strip()
SUPABASE_KEY = input("Supabase Service Role Key: ").strip()
R2_ACCESS    = input("R2 Access Key ID: ").strip()
R2_SECRET    = input("R2 Secret Access Key: ").strip()

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
s3 = boto3.client(
    's3',
    endpoint_url=f'https://{R2_ACCOUNT}.r2.cloudflarestorage.com',
    aws_access_key_id=R2_ACCESS,
    aws_secret_access_key=R2_SECRET,
    region_name='auto'
)

def main():
    print("\nBuscando creaciones con thumb_key para reparar rutas...")
    # Buscamos todas las que tengan thumb_key (las que ya migramos)
    res = supabase.table("creations").select("id, user_id, storage_key, metadata").not_.is_("metadata->>thumb_key", "null").execute()

    if not res.data:
        print("✅ No hay thumbnails que reparar.")
        return

    print(f"🔍 Encontrados {len(res.data)} archivos para reparar.\n")

    for i, row in enumerate(res.data):
        c_id = row['id']
        user_id = row['user_id']
        storage_key = row['storage_key']
        meta = row.get('metadata') or {}
        old_thumb_key = meta.get('thumb_key')

        if not old_thumb_key:
            continue

        # El parent_id es el gen_id original del lote (o el id si es único)
        parent_id = meta.get('parent_id') or c_id
        
        # Extraemos el nombre del archivo original y le ponemos "thumb_"
        filename = storage_key.split('/')[-1]
        new_thumb_key = f"creations/{user_id}/{parent_id}/thumb_{filename}.png"

        # Si la ruta ya está bien, lo saltamos
        if old_thumb_key == new_thumb_key:
            continue

        print(f"[{i+1}/{len(res.data)}] Reparando {c_id}...")
        try:
            # 1. Mover el archivo en R2 (Copiar -> Borrar)
            s3.copy_object(
                Bucket=R2_BUCKET,
                CopySource={'Bucket': R2_BUCKET, 'Key': old_thumb_key},
                Key=new_thumb_key
            )
            s3.delete_object(Bucket=R2_BUCKET, Key=old_thumb_key)
            
            # 2. Actualizar la DB
            new_meta = {**meta, "thumb_key": new_thumb_key}
            supabase.table("creations").update({"metadata": new_meta}).eq("id", c_id).execute()
            
            print(f"  ✅ Movido a: {new_thumb_key}")
        except Exception as e:
            print(f"  ❌ Error: {e}")

    print("\n🎉 Reparación completada.")

if __name__ == "__main__":
    main()
