import asyncio
import logging
import sys
from crawler import Crawler
from search_engine import SearchEngine

# Configure logging to show in terminal
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

import argparse

async def main():
    parser = argparse.ArgumentParser(description="Erlandx Search Crawler")
    parser.add_argument("--minutes", type=int, default=None, help="Stop crawling after X minutes and run PageRank")
    args = parser.parse_args()

    print("🚀 Initializing Erlandx Search Engine Auto-Crawler...")
    
    # Initialize Engine and Crawler
    engine = SearchEngine()
    crawler = Crawler(engine)
    
    print("🌍 Starting crawl on popular seed list (Wikipedia, News, Tech)...")
    if args.minutes:
        print(f"⏳ Timer set for {args.minutes} minutes.")
    print("Press Ctrl+C to stop manually if needed.")
    
    try:
        await crawler.start_auto_crawl(timeout_minutes=args.minutes)
    except KeyboardInterrupt:
        print("\n🛑 Stopping crawler...")
        crawler.stop()
    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
