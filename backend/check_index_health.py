from search_engine import SearchEngine
from whoosh.index import open_dir
import os

INDEX_DIR = "../data/index"

def check_health():
    print("--- Searching Index Health Check ---")
    
    if not os.path.exists(INDEX_DIR):
        print(f"❌ Index directory not found at {INDEX_DIR}")
        return

    try:
        se = SearchEngine()
        ix = open_dir(INDEX_DIR)
        
        # 1. Basic Stats
        doc_count = ix.searcher().doc_count()
        print(f"✅ Index Loaded. Total Documents: {doc_count}")
        
        if doc_count == 0:
            print("⚠️ Index is empty. Crawler might need more time or seeds.")
            return

        # 2. Schema Check
        schema_fields = ix.schema.names()
        print(f"ℹ️ Schema Fields: {', '.join(schema_fields)}")
        expected = ['title', 'url', 'content', 'snippet', 'published_date', 'authority_score']
        missing = [f for f in expected if f not in schema_fields]
        if missing:
            print(f"❌ Missing critical fields: {missing}")
        else:
            print("✅ All critical schema fields present.")

        # 3. Data Integrity Sample
        print("\n--- Inspecting 5 Sample Documents ---")
        with ix.searcher() as s:
            # Get first 5 docs (arbitrary)
            for i, doc in enumerate(s.documents()):
                if i >= 5: break
                print(f"\nDocument {i+1}:")
                print(f"  Title: {doc.get('title', 'N/A')[:50]}...")
                print(f"  URL: {doc.get('url', 'N/A')}")
                print(f"  Date: {doc.get('published_date', 'None')} (Type: {type(doc.get('published_date'))})")
                print(f"  Auth Score: {doc.get('authority_score', 0)} (Type: {type(doc.get('authority_score'))})")
                
        # 4. Authority Score Check
        print("\n--- Authority Score Distribution (Sample) ---")
        with ix.searcher() as s:
            # Count how many have non-zero authority
            # simplistic iteration
            non_zero_auth = 0
            has_date = 0
            count = 0
            for doc in s.documents():
                if doc.get('authority_score', 0) > 0:
                    non_zero_auth += 1
                if doc.get('published_date'):
                    has_date += 1
                count += 1
                if count > 1000: break # check sample of 1000
            
            print(f"Sample Size: {count}")
            print(f"Docs with >0 Authority: {non_zero_auth} ({non_zero_auth/count*100:.1f}%)")
            print(f"Docs with Dates: {has_date} ({has_date/count*100:.1f}%)")

    except Exception as e:
        print(f"❌ Error inspecting index: {e}")

if __name__ == "__main__":
    check_health()
