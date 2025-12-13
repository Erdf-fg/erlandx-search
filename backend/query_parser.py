"""
Query Parser - Natural Language Understanding for Search
Extracts time filters, entities, and structured data from natural queries.
"""

import re
from datetime import datetime, timedelta

class QueryParser:
    """Parses natural language queries into structured search parameters."""
    
    def __init__(self):
        # Time patterns
        self.time_patterns = {
            r'\b(today|hari ini)\b': 0,
            r'\b(yesterday|kemarin)\b': 1,
            r'\b(last|past)\s*(week|minggu)\b': 7,
            r'\b(last|past)\s*(month|bulan)\b': 30,
            r'\b(last|past)\s*(year|tahun)\b': 365,
            r'\b(this\s*week|minggu ini)\b': 7,
            r'\b(this\s*month|bulan ini)\b': 30,
            r'\b(\d+)\s*(days?|hari)\s*(ago|lalu)\b': None,  # Dynamic
            r'\b(recent|terbaru|baru)\b': 7,
        }
        
        # Entity/category patterns
        self.category_patterns = {
            'tutorial': r'\b(tutorial|guide|how\s*to|cara|panduan|belajar)\b',
            'news': r'\b(news|berita|update|breaking)\b',
            'review': r'\b(review|ulasan|comparison|vs|versus)\b',
            'download': r'\b(download|unduh|install)\b',
            'official': r'\b(official|resmi|documentation|docs)\b',
            'video': r'\b(video|youtube|watch|tonton)\b',
            'image': r'\b(image|gambar|photo|foto|picture)\b',
        }
        
        # Site filter patterns
        self.site_pattern = r'\b(?:from|dari|site:|on)\s*([a-zA-Z0-9.-]+\.(?:com|org|net|id|co|io))\b'
        
        # Price patterns
        self.price_patterns = {
            r'\b(under|below|kurang dari|dibawah)\s*(\d+)\s*(juta|million|rb|ribu|k)?\b': 'max',
            r'\b(over|above|lebih dari|diatas)\s*(\d+)\s*(juta|million|rb|ribu|k)?\b': 'min',
            r'\b(cheap|murah|affordable|terjangkau)\b': 'budget',
            r'\b(premium|expensive|mahal)\b': 'premium',
        }
    
    def parse(self, query: str) -> dict:
        """Parse query and extract structured parameters."""
        result = {
            'original_query': query,
            'clean_query': query,
            'time_filter': None,
            'time_days': None,
            'categories': [],
            'site_filter': None,
            'price_hint': None,
            'intent': None,
        }
        
        query_lower = query.lower()
        clean_query = query
        
        # Extract time filter
        for pattern, days in self.time_patterns.items():
            match = re.search(pattern, query_lower, re.IGNORECASE)
            if match:
                if days is None:
                    # Dynamic: "X days ago"
                    try:
                        days = int(match.group(1))
                    except:
                        days = 7
                result['time_filter'] = self._days_to_filter(days)
                result['time_days'] = days
                clean_query = re.sub(pattern, '', clean_query, flags=re.IGNORECASE)
                break
        
        # Extract categories
        for category, pattern in self.category_patterns.items():
            if re.search(pattern, query_lower, re.IGNORECASE):
                result['categories'].append(category)
        
        # Extract site filter
        site_match = re.search(self.site_pattern, query_lower, re.IGNORECASE)
        if site_match:
            result['site_filter'] = site_match.group(1)
            clean_query = re.sub(self.site_pattern, '', clean_query, flags=re.IGNORECASE)
        
        # Extract price hints
        for pattern, price_type in self.price_patterns.items():
            if re.search(pattern, query_lower, re.IGNORECASE):
                result['price_hint'] = price_type
                break
        
        # Detect primary intent
        if result['categories']:
            result['intent'] = result['categories'][0]
        elif 'news' in query_lower or 'berita' in query_lower:
            result['intent'] = 'news'
        elif any(q in query_lower for q in ['what', 'who', 'how', 'why', 'apa', 'siapa', 'bagaimana']):
            result['intent'] = 'question'
        else:
            result['intent'] = 'general'
        
        # Clean up query
        result['clean_query'] = ' '.join(clean_query.split()).strip()
        
        return result
    
    def _days_to_filter(self, days: int) -> str:
        """Convert days to filter string."""
        if days <= 1:
            return '24h'
        elif days <= 7:
            return 'week'
        elif days <= 30:
            return 'month'
        else:
            return 'year'

# Singleton
query_parser = QueryParser()
