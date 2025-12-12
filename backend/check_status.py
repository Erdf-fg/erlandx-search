from search_engine import SearchEngine
import sys

try:
    engine = SearchEngine()
    print(f"✅ Index loaded successfully!")
    print(f"📊 Total Documents: {engine.ix.doc_count()}")
    
    # Show a few sample docs
    print("\n🔍 Sample Documents:")
    with engine.ix.searcher() as searcher:
        for i, doc in enumerate(searcher.documents()):
            if i >= 5: break
            print(f" - [{doc.get('published_date', 'No Date')}] {doc.get('title', 'No Title')}")
            
except Exception as e:
    print(f"❌ Error checking index: {e}")
