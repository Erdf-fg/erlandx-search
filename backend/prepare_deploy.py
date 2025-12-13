import os
import shutil

# Config
SOURCE_INDEX_DIR = "../data/index"
DEST_INDEX_DIR = "index_deploy"  # We will upload this folder
CHUNK_SIZE = 9 * 1024 * 1024  # 9MB (strictly under Hugging Face 10MB limit)

def prepare_deploy():
    print(f"📦 Preparing index for deployment...")
    
    # 1. Clean/Create dest dir
    if os.path.exists(DEST_INDEX_DIR):
        shutil.rmtree(DEST_INDEX_DIR)
    os.makedirs(DEST_INDEX_DIR)
    
    files = os.listdir(SOURCE_INDEX_DIR)
    
    for fname in files:
        if fname.startswith('.') or fname == 'MAIN_WRITELOCK':
            continue
            
        src_path = os.path.join(SOURCE_INDEX_DIR, fname)
        size = os.path.getsize(src_path)
        
        if size > CHUNK_SIZE:
            # Split large file
            print(f"✂️  Splitting large file: {fname} ({size / 1024 / 1024:.2f} MB)")
            with open(src_path, 'rb') as f_src:
                part_num = 0
                while True:
                    chunk = f_src.read(CHUNK_SIZE)
                    if not chunk:
                        break
                    
                    # Use 3-digit zero padding for correct alphabetical sorting (part000, part001... part010)
                    part_name = f"{fname}.part{part_num:03d}"
                    dest_path = os.path.join(DEST_INDEX_DIR, part_name)
                    
                    with open(dest_path, 'wb') as f_dest:
                        f_dest.write(chunk)
                    
                    print(f"   -> Created {part_name}")
                    part_num += 1
        else:
            # Copy small file
            # print(f"📄 Copying {fname}...")
            shutil.copy2(src_path, os.path.join(DEST_INDEX_DIR, fname))
            
    print(f"\n✅ Index prepared in '{DEST_INDEX_DIR}'")
    print("   Upload the 'backend' folder to GitHub now.")

if __name__ == "__main__":
    prepare_deploy()
