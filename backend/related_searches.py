"""
Related Searches Generator
Generates related search suggestions based on query analysis.
"""

import re
from typing import List
from collections import Counter


class RelatedSearches:
    def __init__(self):
        # Common query patterns and variations
        self.synonyms = {
            'tutorial': ['guide', 'how to', 'learn', 'course'],
            'download': ['get', 'install', 'setup'],
            'python': ['python3', 'py'],
            'javascript': ['js', 'node'],
            'best': ['top', 'recommended', 'popular'],
            'free': ['open source', 'gratis'],
        }
    
    def generate(self, query: str, limit: int = 5) -> List[str]:
        """Generate related search suggestions."""
        query = query.strip().lower()
        related = []
        
        # Extract main keywords
        words = re.findall(r'\b\w+\b', query)
        
        # Method 1: Add question variations
        if not any(q in query for q in ['how', 'what', 'why', 'when', 'where']):
            related.append(f"how to {query}")
            related.append(f"what is {query}")
        
        # Method 2: Add "best" or "tutorial" if not present
        if 'best' not in query and 'top' not in query:
            related.append(f"best {query}")
        
        if 'tutorial' not in query and 'guide' not in query:
            related.append(f"{query} tutorial")
        
        # Method 3: Synonym substitution
        for word, syns in self.synonyms.items():
            if word in query:
                for syn in syns[:2]:  # Max 2 synonyms
                    alt_query = query.replace(word, syn)
                    if alt_query != query:
                        related.append(alt_query)
        
        # Method 4: Add common modifiers
        if len(words) <= 2:
            related.append(f"{query} examples")
            related.append(f"{query} vs")
        
        # Remove duplicates and limit
        seen = set()
        unique_related = []
        for r in related:
            r_clean = r.strip()
            if r_clean not in seen and r_clean != query:
                seen.add(r_clean)
                unique_related.append(r_clean)
                if len(unique_related) >= limit:
                    break
        
        return unique_related


# Global instance
related_searches = RelatedSearches()
