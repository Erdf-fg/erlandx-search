"""
Index Optimization Script for Erlandx Search
Fast and efficient index optimization with multiple modes.
"""

import os
import argparse
from whoosh.index import open_dir, exists_in
import json

DATA_DIR = "../data"
INDEX_DIR = f"{DATA_DIR}/index"
PAGERANK_FILE = f"{DATA_DIR}/pagerank_scores.json"

def get_index_stats():
    """Get current index statistics."""
    if not exists_in(INDEX_DIR):
        return None
    
    ix = open_dir(INDEX_DIR)
    with ix.searcher() as searcher:
        doc_count = searcher.doc_count()
    
    # Count segment files
    seg_files = [f for f in os.listdir(INDEX_DIR) if f.endswith('.seg')]
    
    # Get total size
    index_size = sum(
        os.path.getsize(os.path.join(INDEX_DIR, f))
        for f in os.listdir(INDEX_DIR)
        if os.path.isfile(os.path.join(INDEX_DIR, f))
    )
    
    return {
        'docs': doc_count,
        'segments': len(seg_files),
        'size_mb': index_size / (1024*1024)
    }

def fast_optimize():
    """
    FAST MODE: Just commit pending changes and do light cleanup.
    Time: ~5 seconds
    """
    print("⚡ Fast Optimization (Light Cleanup)")
    print("-" * 40)
    
    ix = open_dir(INDEX_DIR)
    writer = ix.writer()
    writer.commit()  # No optimize=True, just commit
    
    print("✅ Done! Pending changes committed.")

def medium_optimize():
    """
    MEDIUM MODE: Merge small segments only.
    Time: ~30-60 seconds
    """
    print("🔧 Medium Optimization (Partial Merge)")
    print("-" * 40)
    
    ix = open_dir(INDEX_DIR)
    writer = ix.writer()
    # Merge segments smaller than 1000 docs
    writer.commit(merge=True)
    
    print("✅ Done! Small segments merged.")

def full_optimize():
    """
    FULL MODE: Merge ALL segments into one (slowest).
    Time: 5-10+ minutes depending on size
    """
    print("🔥 Full Optimization (Complete Merge)")
    print("-" * 40)
    print("⚠️  This may take several minutes...")
    
    ix = open_dir(INDEX_DIR)
    writer = ix.writer()
    writer.commit(optimize=True)  # Full optimization
    
    print("✅ Done! All segments merged into one.")

def main():
    parser = argparse.ArgumentParser(description="Erlandx Search Index Optimizer")
    parser.add_argument(
        "--mode", 
        choices=["fast", "medium", "full", "stats"],
        default="fast",
        help="Optimization mode: fast (5s), medium (30s), full (5min+), stats (show only)"
    )
    args = parser.parse_args()
    
    print("🔧 Erlandx Search Index Optimizer")
    print("=" * 50)
    
    # Check if index exists
    if not exists_in(INDEX_DIR):
        print("❌ No index found!")
        return
    
    # Show before stats
    stats = get_index_stats()
    print(f"\n📊 Current Index:")
    print(f"   Documents: {stats['docs']:,}")
    print(f"   Segments:  {stats['segments']}")
    print(f"   Size:      {stats['size_mb']:.2f} MB")
    
    if args.mode == "stats":
        return
    
    print()
    
    # Run optimization
    if args.mode == "fast":
        fast_optimize()
    elif args.mode == "medium":
        medium_optimize()
    elif args.mode == "full":
        full_optimize()
    
    # Show after stats
    new_stats = get_index_stats()
    print(f"\n📊 After Optimization:")
    print(f"   Documents: {new_stats['docs']:,}")
    print(f"   Segments:  {new_stats['segments']}")
    print(f"   Size:      {new_stats['size_mb']:.2f} MB")
    
    # Show savings
    if stats['size_mb'] > new_stats['size_mb']:
        saved = stats['size_mb'] - new_stats['size_mb']
        print(f"\n💾 Saved: {saved:.2f} MB ({saved/stats['size_mb']*100:.1f}%)")

if __name__ == "__main__":
    main()
