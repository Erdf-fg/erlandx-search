import sqlite3
import os
from datetime import datetime

DB_PATH = "../data/analytics.db"

class ClickTracker:
    def __init__(self):
        self._init_db()

    def _init_db(self):
        if not os.path.exists("../data"):
            os.makedirs("../data")
            
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''
            CREATE TABLE IF NOT EXISTS clicks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                query TEXT,
                url TEXT,
                position INTEGER,
                timestamp DATETIME
            )
        ''')
        # Create index for fast lookups
        c.execute('CREATE INDEX IF NOT EXISTS idx_query_url ON clicks (query, url)')
        conn.commit()
        conn.close()

    def track_click(self, query, url, position):
        """Record a user click."""
        try:
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute('INSERT INTO clicks (query, url, position, timestamp) VALUES (?, ?, ?, ?)',
                      (query.lower(), url, position, datetime.now()))
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Tracking error: {e}")
            return False

    def get_boost_map(self, query):
        """Get click-based boost scores for a query."""
        try:
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            
            # Simple formula: Count clicks per URL for this query
            c.execute('''
                SELECT url, COUNT(*) as count 
                FROM clicks 
                WHERE query = ? 
                GROUP BY url
            ''', (query.lower(),))
            
            rows = c.fetchall()
            conn.close()
            
            # Normalize boosts: Max boost 2.0x for highly clicked items
            boosts = {}
            if not rows:
                return {}
                
            max_clicks = max(r[1] for r in rows)
            
            for url, count in rows:
                # Formula: 1.0 + (count / max_clicks) * 0.5  -> Max 1.5x boost
                # This ensures popular items get a nudge, but not overwhelming
                boosts[url] = 1.0 + (count / max_clicks) * 0.5
                
            return boosts
        except Exception as e:
            print(f"Analytics fetch error: {e}")
            return {}

    def get_trending_queries(self, limit=10):
        """Get trending search queries based on recent activity."""
        try:
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            
            # Get most popular queries in last 24 hours
            c.execute('''
                SELECT query, COUNT(*) as count 
                FROM clicks 
                WHERE timestamp > datetime('now', '-1 day')
                GROUP BY query
                ORDER BY count DESC
                LIMIT ?
            ''', (limit,))
            
            rows = c.fetchall()
            conn.close()
            
            return [{"query": r[0], "count": r[1], "type": "trending"} for r in rows]
        except Exception as e:
            print(f"Trending fetch error: {e}")
            return []

    def log_search(self, query):
        """Log a search query for analytics."""
        try:
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            
            # Create searches table if not exists
            c.execute('''
                CREATE TABLE IF NOT EXISTS searches (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    query TEXT,
                    timestamp DATETIME
                )
            ''')
            c.execute('CREATE INDEX IF NOT EXISTS idx_search_query ON searches (query)')
            
            c.execute('INSERT INTO searches (query, timestamp) VALUES (?, ?)',
                      (query.lower(), datetime.now()))
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Search log error: {e}")
            return False

    def get_query_suggestions(self, prefix, limit=8):
        """Get query suggestions based on prefix matching."""
        try:
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            
            # Get matching queries from search history
            c.execute('''
                SELECT query, COUNT(*) as count 
                FROM searches 
                WHERE query LIKE ?
                GROUP BY query
                ORDER BY count DESC
                LIMIT ?
            ''', (f"{prefix.lower()}%", limit))
            
            rows = c.fetchall()
            conn.close()
            
            return [{"query": r[0], "count": r[1], "type": "history"} for r in rows]
        except Exception as e:
            print(f"Suggestions fetch error: {e}")
            return []

# Singleton instance
tracker = ClickTracker()
