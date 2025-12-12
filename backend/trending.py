"""
Trending/Popular Searches Tracker
Tracks search query frequency for trending searches feature.
Privacy-focused: Only tracks query strings, no user data.
"""

import json
import os
from datetime import datetime, timedelta
from collections import Counter
from typing import List, Dict

TRENDING_FILE = "../data/trending_searches.json"


class TrendingTracker:
    def __init__(self):
        self.data = self._load_data()
    
    def _load_data(self) -> Dict:
        """Load trending data from file."""
        if os.path.exists(TRENDING_FILE):
            try:
                with open(TRENDING_FILE, 'r') as f:
                    data = json.load(f)
                    # Check if data is from today
                    last_reset = data.get('last_reset', '')
                    if last_reset != datetime.now().strftime('%Y-%m-%d'):
                        # Reset daily
                        return self._create_empty_data()
                    return data
            except Exception:
                return self._create_empty_data()
        return self._create_empty_data()
    
    def _create_empty_data(self) -> Dict:
        """Create empty trending data structure."""
        return {
            'last_reset': datetime.now().strftime('%Y-%m-%d'),
            'queries': {}
        }
    
    def _save_data(self):
        """Save trending data to file."""
        os.makedirs(os.path.dirname(TRENDING_FILE), exist_ok=True)
        with open(TRENDING_FILE, 'w') as f:
            json.dump(self.data, f)
    
    def track_query(self, query: str):
        """Track a search query (increment count)."""
        if not query or len(query.strip()) < 2:
            return
        
        query = query.strip().lower()
        
        # Check if need to reset (daily)
        if self.data['last_reset'] != datetime.now().strftime('%Y-%m-%d'):
            self.data = self._create_empty_data()
        
        # Increment count
        if query in self.data['queries']:
            self.data['queries'][query] += 1
        else:
            self.data['queries'][query] = 1
        
        self._save_data()
    
    def get_trending(self, limit: int = 10) -> List[Dict[str, any]]:
        """Get top trending searches."""
        # Sort by count descending
        sorted_queries = sorted(
            self.data['queries'].items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        # Return top N
        trending = []
        for query, count in sorted_queries[:limit]:
            trending.append({
                'query': query,
                'count': count
            })
        
        return trending
    
    def reset(self):
        """Manually reset trending data."""
        self.data = self._create_empty_data()
        self._save_data()


# Global instance
tracker = TrendingTracker()
