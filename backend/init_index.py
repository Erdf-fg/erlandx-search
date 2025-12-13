from search_engine import SearchEngine
import sys
import os

def init():
    print("🔋 Initializing Search Engine Index...")
    try:
        # This will create the index directory and schema if they don't exist
        engine = SearchEngine()
        print("✅ Index initialized successfully.")
        # Use absolute path for HF persistent storage
        # Logic matches search_engine.py dynamically
        PERSISTENT_ROOT = "/data"
        LOCAL_ROOT = os.path.join(os.getcwd(), "data")

        if os.path.exists(PERSISTENT_ROOT) and os.access(PERSISTENT_ROOT, os.W_OK):
            INDEX_DIR = os.path.join(PERSISTENT_ROOT, "index")
        else:
            INDEX_DIR = os.path.join(LOCAL_ROOT, "index")
        
        if not os.path.exists(INDEX_DIR):
            print(f"📁 Creating Index Directory: {INDEX_DIR}")
            os.makedirs(INDEX_DIR)
    except Exception as e:
        print(f"❌ Error initializing index: {e}")
        sys.exit(1)

if __name__ == "__main__":
    init()
