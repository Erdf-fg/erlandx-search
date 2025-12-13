#!/usr/bin/env python3

import asyncio
import time
import os
import sys
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from search_engine import SearchEngine
from crawler import Crawler

# Configuration
CRAWL_DURATION_MINUTES = 60  # Crawl for 1 hour then restart
PAUSE_BETWEEN_SESSIONS = 60  # 1 minute pause between sessions
MAX_SESSIONS = 0  # 0 = unlimited (run forever)

def get_index_stats(engine):
    """Get current index statistics."""
    try:
        with engine.ix.searcher() as searcher:
            doc_count = searcher.doc_count()
        
        # Get PageRank count
        pr_count = len(engine.pagerank_scores) if hasattr(engine, 'pagerank_scores') else 0
        
        return doc_count, pr_count
    except:
        return 0, 0

async def run_crawl_session(session_num):
    """Run a single crawl session."""
    print(f"\n{'='*60}")
    print(f"🚀 Starting Crawl Session #{session_num}")
    print(f"   Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"   Duration: {CRAWL_DURATION_MINUTES} minutes")
    print(f"{'='*60}\n")
    
    # Initialize engine and crawler
    engine = SearchEngine()
    crawler = Crawler(engine)
    
    # Get before stats
    docs_before, pr_before = get_index_stats(engine)
    print(f"📊 Before: {docs_before:,} docs, {pr_before:,} URLs in PageRank")
    
    # Run crawler
    try:
        await crawler.start_auto_crawl(timeout_minutes=CRAWL_DURATION_MINUTES)
    except KeyboardInterrupt:
        print("\n⚠️ Crawl interrupted by user")
        crawler.running = False
    except Exception as e:
        print(f"❌ Crawl error: {e}")
    finally:
        # Close browser
        try:
            await crawler.close_browser()
        except:
            pass
    
    # Get after stats
    docs_after, pr_after = get_index_stats(engine)
    
    print(f"\n📊 After: {docs_after:,} docs, {pr_after:,} URLs in PageRank")
    print(f"   ➕ New docs: +{docs_after - docs_before:,}")
    print(f"   ➕ New URLs: +{pr_after - pr_before:,}")
    
    # Close engine
    try:
        engine.close()
    except:
        pass
    
    return docs_after

def main():
    print("""
╔═══════════════════════════════════════════════════════════╗
║         ERLANDX SEARCH - CONTINUOUS CRAWLER               ║
║                                                           ║
║   This script will crawl the web 24/7 to build your      ║
║   search index. Keep this running for best coverage.     ║
║                                                           ║
║   Press Ctrl+C to stop gracefully.                       ║
╚═══════════════════════════════════════════════════════════╝
""")
    
    session = 1
    
    while True:
        try:
            # Run crawl session
            docs = asyncio.run(run_crawl_session(session))
            
            # Check max sessions
            if MAX_SESSIONS > 0 and session >= MAX_SESSIONS:
                print(f"\n✅ Completed {MAX_SESSIONS} sessions. Stopping.")
                break
            
            # Pause before next session
            print(f"\n⏸️ Pausing for {PAUSE_BETWEEN_SESSIONS} seconds before next session...")
            time.sleep(PAUSE_BETWEEN_SESSIONS)
            
            session += 1
            
        except KeyboardInterrupt:
            print("\n\n🛑 Crawler stopped by user.")
            print(f"   Total sessions completed: {session}")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}")
            print("   Restarting in 60 seconds...")
            time.sleep(60)

if __name__ == "__main__":
    main()
