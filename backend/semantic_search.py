"""
Semantic Search - TF-IDF based semantic similarity
Lightweight approach without heavy ML models.
"""

import re
import math
from collections import defaultdict
from typing import Dict, List, Tuple

class SemanticSearcher:
    """TF-IDF based semantic similarity for search enhancement."""
    
    def __init__(self):
        self.vocabulary = {}
        self.idf_scores = {}
        self.document_vectors = {}
        self.stopwords = {
            'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
            'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used',
            'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'up', 'about',
            'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between',
            'and', 'but', 'or', 'nor', 'so', 'yet', 'both', 'either', 'neither',
            'not', 'only', 'own', 'same', 'than', 'too', 'very', 'just',
            'yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'dengan', 'adalah', 'ini', 'itu',
            'tidak', 'ada', 'bisa', 'atau', 'juga', 'sudah', 'akan', 'saya', 'kamu',
        }
        
        # Synonym groups for semantic matching
        self.synonyms = {
            'tutorial': ['guide', 'howto', 'learn', 'course', 'lesson', 'cara', 'panduan', 'belajar'],
            'website': ['web', 'site', 'page', 'situs', 'halaman'],
            'create': ['make', 'build', 'develop', 'bikin', 'buat', 'membuat'],
            'best': ['top', 'greatest', 'recommended', 'terbaik', 'bagus'],
            'cheap': ['affordable', 'budget', 'murah', 'terjangkau'],
            'download': ['install', 'get', 'unduh', 'pasang'],
            'error': ['bug', 'issue', 'problem', 'masalah', 'gagal'],
            'fix': ['solve', 'repair', 'resolve', 'perbaiki', 'solusi'],
        }
        
        # Build reverse synonym map
        self.synonym_map = {}
        for canonical, synonyms in self.synonyms.items():
            self.synonym_map[canonical] = canonical
            for syn in synonyms:
                self.synonym_map[syn.lower()] = canonical
    
    def tokenize(self, text: str) -> List[str]:
        """Tokenize and normalize text."""
        text = text.lower()
        text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)
        tokens = text.split()
        
        # Remove stopwords and apply synonym normalization
        normalized = []
        for token in tokens:
            if token not in self.stopwords and len(token) > 1:
                # Normalize synonyms
                normalized_token = self.synonym_map.get(token, token)
                normalized.append(normalized_token)
        
        return normalized
    
    def compute_tf(self, tokens: List[str]) -> Dict[str, float]:
        """Compute term frequency."""
        tf = defaultdict(int)
        for token in tokens:
            tf[token] += 1
        
        # Normalize by document length
        total = len(tokens)
        if total > 0:
            tf = {k: v / total for k, v in tf.items()}
        
        return dict(tf)
    
    def compute_similarity(self, query: str, document: str) -> float:
        """Compute cosine similarity between query and document."""
        query_tokens = self.tokenize(query)
        doc_tokens = self.tokenize(document)
        
        if not query_tokens or not doc_tokens:
            return 0.0
        
        # Compute TF vectors
        query_tf = self.compute_tf(query_tokens)
        doc_tf = self.compute_tf(doc_tokens)
        
        # Get all terms
        all_terms = set(query_tf.keys()) | set(doc_tf.keys())
        
        # Compute dot product and magnitudes
        dot_product = 0.0
        query_mag = 0.0
        doc_mag = 0.0
        
        for term in all_terms:
            q_val = query_tf.get(term, 0)
            d_val = doc_tf.get(term, 0)
            
            dot_product += q_val * d_val
            query_mag += q_val ** 2
            doc_mag += d_val ** 2
        
        query_mag = math.sqrt(query_mag)
        doc_mag = math.sqrt(doc_mag)
        
        if query_mag == 0 or doc_mag == 0:
            return 0.0
        
        return dot_product / (query_mag * doc_mag)
    
    def score_results(self, query: str, results: List[dict], weight: float = 0.3) -> List[dict]:
        """Score results with semantic similarity and combine with existing score."""
        for result in results:
            content = f"{result.get('title', '')} {result.get('snippet', '')}"
            semantic_score = self.compute_similarity(query, content)
            
            # Hybrid score: (1-weight) * original + weight * semantic
            original_score = result.get('score', 0.5)
            hybrid_score = (1 - weight) * original_score + weight * semantic_score
            
            result['semantic_score'] = round(semantic_score, 4)
            result['hybrid_score'] = round(hybrid_score, 4)
        
        # Re-sort by hybrid score
        results.sort(key=lambda x: x.get('hybrid_score', 0), reverse=True)
        
        return results

# Singleton
semantic_searcher = SemanticSearcher()
