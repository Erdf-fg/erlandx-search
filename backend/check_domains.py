from search_engine import SearchEngine
from urllib.parse import urlparse

try:
    engine = SearchEngine()
    print(f"📊 Analyzing {engine.ix.doc_count()} documents...")
    
    unique_domains = {}
    
    with engine.ix.searcher() as searcher:
        for doc in searcher.documents():
            url = doc.get('url', '')
            if url:
                domain = urlparse(url).netloc
                unique_domains[domain] = unique_domains.get(domain, 0) + 1
    
    print("\n🏆 Top Indexed Domains:")
    sorted_domains = sorted(unique_domains.items(), key=lambda x: x[1], reverse=True)
    for domain, count in sorted_domains:
        print(f" - {domain}: {count} docs")
        
except Exception as e:
    print(f"❌ Error: {e}")
