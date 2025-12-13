"""
Database Cleanup Script for Erlandx Search
Removes low-value content to improve search quality and performance.
"""

import json
import os
from urllib.parse import urlparse

DATA_DIR = "../data"
PAGERANK_FILE = f"{DATA_DIR}/pagerank_scores.json"
LINKGRAPH_FILE = f"{DATA_DIR}/link_graph.json"

# Patterns to REMOVE from database
REMOVE_PATTERNS = [
    # Non-English/Indonesian Wikipedia (keep only en and id)
    "ar.wikipedia.org",
    "bn.wikipedia.org",
    "bg.wikipedia.org",
    "ca.wikipedia.org",
    "ast.wikipedia.org",
    "az.wikipedia.org",
    "bs.wikipedia.org",
    "el.wikipedia.org",
    "ckb.wikipedia.org",
    "be.wikipedia.org",
    "cs.wikipedia.org",
    "da.wikipedia.org",
    "et.wikipedia.org",
    "eu.wikipedia.org",
    "fa.wikipedia.org",
    "fi.wikipedia.org",
    "fr.wikipedia.org",
    "gl.wikipedia.org",
    "he.wikipedia.org",
    "hi.wikipedia.org",
    "hr.wikipedia.org",
    "hu.wikipedia.org",
    "hy.wikipedia.org",
    "it.wikipedia.org",
    "ja.wikipedia.org",
    "ka.wikipedia.org",
    "kk.wikipedia.org",
    "ko.wikipedia.org",
    "lt.wikipedia.org",
    "lv.wikipedia.org",
    "mk.wikipedia.org",
    "ml.wikipedia.org",
    "ms.wikipedia.org",
    "my.wikipedia.org",
    "nl.wikipedia.org",
    "nn.wikipedia.org",
    "no.wikipedia.org",
    "pl.wikipedia.org",
    "pt.wikipedia.org",
    "ro.wikipedia.org",
    "ru.wikipedia.org",
    "sh.wikipedia.org",
    "simple.wikipedia.org",
    "sk.wikipedia.org",
    "sl.wikipedia.org",
    "sq.wikipedia.org",
    "sr.wikipedia.org",
    "sv.wikipedia.org",
    "ta.wikipedia.org",
    "te.wikipedia.org",
    "th.wikipedia.org",
    "tl.wikipedia.org",
    "tr.wikipedia.org",
    "uk.wikipedia.org",
    "ur.wikipedia.org",
    "uz.wikipedia.org",
    "vi.wikipedia.org",
    "zh.wikipedia.org",
    "war.wikipedia.org",
    "ceb.wikipedia.org",
    
    # Archive/Snapshot sites
    "web.archive.org",
    "archive.org/details",
    "archive.org/stream",
    
    # Academic reference links (not user-friendly)
    "doi.org/",
    "dx.doi.org/",
    
    # Low-value URL patterns
    "/login",
    "/signin",
    "/signup",
    "/register",
    "/password",
    "/cart",
    "/checkout",
    "/privacy",
    "/terms",
    "/cookie",
    "/legal",
    "/disclaimer",
]

def should_remove(url: str) -> bool:
    """Check if URL should be removed."""
    url_lower = url.lower()
    return any(pattern in url_lower for pattern in REMOVE_PATTERNS)

def cleanup_pagerank():
    """Clean up PageRank scores file."""
    print("📊 Loading PageRank scores...")
    
    with open(PAGERANK_FILE, 'r') as f:
        pagerank = json.load(f)
    
    original_count = len(pagerank)
    print(f"   Original entries: {original_count}")
    
    # Filter out unwanted URLs
    cleaned = {url: score for url, score in pagerank.items() if not should_remove(url)}
    
    removed_count = original_count - len(cleaned)
    print(f"   Removed: {removed_count} entries")
    print(f"   Remaining: {len(cleaned)} entries")
    
    # Backup original
    backup_file = f"{PAGERANK_FILE}.backup"
    if not os.path.exists(backup_file):
        os.rename(PAGERANK_FILE, backup_file)
        print(f"   Backup saved to: {backup_file}")
    
    # Save cleaned version
    with open(PAGERANK_FILE, 'w') as f:
        json.dump(cleaned, f)
    
    print(f"   ✅ Cleaned PageRank saved")
    return removed_count

def cleanup_linkgraph():
    """Clean up link graph file."""
    print("\n🔗 Loading Link Graph...")
    
    with open(LINKGRAPH_FILE, 'r') as f:
        linkgraph = json.load(f)
    
    original_count = len(linkgraph)
    print(f"   Original entries: {original_count}")
    
    # Filter out unwanted URLs (both keys and values)
    cleaned = {}
    for url, links in linkgraph.items():
        if not should_remove(url):
            # Also filter out bad links from the outgoing links
            cleaned_links = [link for link in links if not should_remove(link)]
            if cleaned_links:  # Only keep if there are remaining links
                cleaned[url] = cleaned_links
    
    removed_count = original_count - len(cleaned)
    print(f"   Removed: {removed_count} entries")
    print(f"   Remaining: {len(cleaned)} entries")
    
    # Backup original
    backup_file = f"{LINKGRAPH_FILE}.backup"
    if not os.path.exists(backup_file):
        os.rename(LINKGRAPH_FILE, backup_file)
        print(f"   Backup saved to: {backup_file}")
    
    # Save cleaned version
    with open(LINKGRAPH_FILE, 'w') as f:
        json.dump(cleaned, f)
    
    print(f"   ✅ Cleaned Link Graph saved")
    return removed_count

def main():
    print("🧹 Erlandx Search Database Cleanup")
    print("=" * 50)
    
    pr_removed = cleanup_pagerank()
    lg_removed = cleanup_linkgraph()
    
    print("\n" + "=" * 50)
    print(f"🎉 Cleanup Complete!")
    print(f"   Total removed from PageRank: {pr_removed}")
    print(f"   Total removed from LinkGraph: {lg_removed}")
    print(f"\n💡 Next step: Rebuild the search index for best results")
    print(f"   Run: python3 rebuild_index.py")

if __name__ == "__main__":
    main()
