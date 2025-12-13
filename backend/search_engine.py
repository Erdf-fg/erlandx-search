import os
import re
from whoosh.index import create_in, open_dir, exists_in, LockError
from whoosh.fields import Schema, TEXT, ID, STORED, DATETIME, NUMERIC
from whoosh.qparser import QueryParser, MultifieldParser, OrGroup
from whoosh.analysis import StemmingAnalyzer
from whoosh import scoring
import time
from functools import lru_cache
import hashlib
from datetime import datetime
from trending import tracker as trending_tracker

# Handle Persistent vs Ephemeral Storage
# HF Spaces mounts persistent volume at /data
# If not available (or permission denied), fallback to local ./data
PERSISTENT_ROOT = "/data"
LOCAL_ROOT = os.path.join(os.getcwd(), "data")

if os.path.exists(PERSISTENT_ROOT) and os.access(PERSISTENT_ROOT, os.W_OK):
    INDEX_DIR = os.path.join(PERSISTENT_ROOT, "index")
    print(f"💾 Using Persistent Storage at {INDEX_DIR}")
else:
    INDEX_DIR = os.path.join(LOCAL_ROOT, "index")
    print(f"⚠️  Persistent Storage not available. Using local: {INDEX_DIR}")

class SynonymExpander:
    """Expands queries with common synonyms."""
    def __init__(self):
        self.synonyms = {
            'laptop': ['notebook', 'computer', 'macbook', 'pc'],
            'phone': ['smartphone', 'mobile', 'iphone', 'android', 'hp', 'handphone', 'ponsel'],
            'change': ['adjust', 'modify', 'alter', 'switch', 'update'],
            'brightness': ['luminance', 'light', 'screen', 'display'],
            'buy': ['purchase', 'order', 'shop', 'get', 'beli', 'belanja'],
            'best': ['top', 'recommended', 'popular', 'greatest', 'terbaik', 'bagus'],
            'tutorial': ['guide', 'how to', 'learn', 'lesson', 'cara', 'panduan', 'belajar'],
            'error': ['bug', 'issue', 'problem', 'crash', 'fail', 'masalah', 'error'],
            'fix': ['solve', 'repair', 'resolve', 'patch', 'perbaiki', 'solusi'],
            'movie': ['film', 'cinema', 'show', 'bioskop', 'tontonan'],
            'coding': ['programming', 'development', 'software', 'ngoding', 'pemrograman'],
            'recipe': ['cooking', 'food', 'dish', 'meal', 'resep', 'masakan'],
            'download': ['install', 'get', 'unduh'],
            'game': ['gaming', 'play', 'permainan'],
            'news': ['update', 'latest', 'info', 'berita', 'kabar'],
            'price': ['cost', 'value', 'harga', 'biaya', 'tarif']
        }

    def expand(self, query):
        words = query.lower().split()
        expanded_query = [query]
        
        for word in words:
            if word in self.synonyms:
                # Add synonyms with lower boost (OR logic)
                for syn in self.synonyms[word]:
                    expanded_query.append(syn)
        
        return " ".join(list(set(expanded_query)))

class IntentClassifier:
    """Classifies query intent with language detection and query rewriting."""
    def __init__(self):
        self.intents = {
            'news': ['news', 'latest', 'recent', 'today', 'update', 'breaking', 'berita', 'terbaru', 'hari ini'],
            'educational': ['how to', 'tutorial', 'guide', 'learn', 'what is', 'define', 'meaning', 'cara', 'belajar', 'apa itu', 'pengertian'],
            'shopping': ['buy', 'price', 'cost', 'cheap', 'best', 'review', 'vs', 'beli', 'harga', 'murah', 'terbaik'],
            'technical': ['error', 'bug', 'fix', 'code', 'python', 'java', 'react', 'api', 'sdk', 'debug', 'troubleshoot'],
            'navigational': ['login', 'signin', 'download', 'website', 'official', 'masuk', 'unduh', 'resmi'],
            'local': ['near me', 'nearby', 'terdekat', 'di dekat', 'lokasi'],
            'question': ['what', 'who', 'where', 'when', 'why', 'how', 'is', 'are', 'can', 'does', 'apa', 'siapa', 'dimana', 'kapan', 'mengapa', 'bagaimana'],
            'transactional': ['order', 'book', 'reserve', 'subscribe', 'pesan', 'booking', 'langganan'],
            'media': ['video', 'image', 'photo', 'picture', 'gambar', 'foto', 'film', 'movie', 'musik', 'music']
        }
        
        # Indonesian common words for language detection
        self.indonesian_markers = [
            'yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'dengan', 'adalah', 'ini', 'itu',
            'tidak', 'ada', 'bisa', 'atau', 'juga', 'sudah', 'akan', 'saya', 'kamu', 'kami',
            'cara', 'bagaimana', 'apa', 'siapa', 'kapan', 'dimana', 'mengapa', 'apakah',
            'terbaik', 'terdekat', 'murah', 'gratis', 'resep', 'berita'
        ]

    def classify(self, query):
        query_lower = query.lower()
        detected_intents = []
        
        for intent, keywords in self.intents.items():
            if any(k in query_lower for k in keywords):
                detected_intents.append(intent)
        
        return detected_intents
    
    def detect_language(self, query):
        """Detect if query is Indonesian or English."""
        words = query.lower().split()
        indo_score = sum(1 for word in words if word in self.indonesian_markers)
        
        # If more than 30% of words are Indonesian markers, classify as Indonesian
        if len(words) > 0 and (indo_score / len(words)) > 0.3:
            return 'id'
        return 'en'
    
    def suggest_rewrite(self, query):
        """Suggest query rewrites for better results."""
        query_lower = query.lower()
        suggestions = []
        
        # Common misspellings/improvements
        rewrites = {
            'harga': 'price',
            'cara': 'how to',
            'terbaik': 'best',
            'gratis': 'free',
            'download': 'unduh',
        }
        
        for term, alt in rewrites.items():
            if term in query_lower:
                suggestions.append(query_lower.replace(term, alt))
        
        return suggestions[:3]  # Return max 3 suggestions

class SearchEngine:
    def __init__(self):
        # IMPORTANT: Setup index FIRST to create self.ix
        self.setup_index()
        
        # Load PageRank scores for hybrid ranking
        self.pagerank_scores = self._load_pagerank()
        
        # Initialize Intelligence Components
        self.synonym_expander = SynonymExpander()
        self.intent_classifier = IntentClassifier()
        
        # Pre-compile regex patterns for speed
        self.snippet_pattern = re.compile(r'([^.!?]*(?:[.!?]|$))')
        self.whitespace_pattern = re.compile(r'\s+')
        
        # Performance: Query cache with longer TTL and size limit
        self.query_cache = {}
        self.cache_ttl = 600  # 10 minutes (increased from 5)
        self.cache_max_size = 500  # Max cached queries
        self.cache_hits = 0
        self.cache_misses = 0
        
        # Keep searcher warm for faster queries (AFTER setup_index)
        self.searcher = None
        self._refresh_searcher()
        
        print(f"⚡ Search Engine initialized with {self.cache_max_size} query cache slots")
    
    def _load_pagerank(self):
        """Load PageRank scores from production data (not mock)."""
        try:
            from pagerank import load_pagerank
            scores = load_pagerank()
            print(f"📊 Loaded PageRank scores for {len(scores)} pages")
            return scores
        except Exception as e:
            print(f"⚠️ Could not load PageRank: {e}")
            return {}
    
    def _refresh_searcher(self):
        """Refresh searcher instance for production performance."""
        if self.searcher:
            self.searcher.close()
        self.searcher = self.ix.searcher(weighting=scoring.BM25F())

    def setup_index(self):
        if not os.path.exists(INDEX_DIR):
            os.makedirs(INDEX_DIR)
        
        # Schema:
        # title: The page title (indexed, stored)
        # url: The page URL (ID, stored)
        # content: The full text (indexed, stored)
        # snippet: A short summary (stored)
        # published_date: Date for recency boosting (stored, sortable)
        # authority_score: Domain authority score (stored, numeric)
        schema = Schema(
            title=TEXT(stored=True, analyzer=StemmingAnalyzer(), field_boost=2.0),
            url=ID(stored=True, unique=True),
            content=TEXT(stored=True, analyzer=StemmingAnalyzer()),
            snippet=STORED,
            image_url=STORED,
            published_date=DATETIME(stored=True, sortable=True),
            authority_score=NUMERIC(int, stored=True, sortable=True, default=0), # Scaled Integer (x10000)
        )

        if not exists_in(INDEX_DIR):
            create_in(INDEX_DIR, schema)
            print(f"Created new index in {INDEX_DIR}")
        else:
            # Check if we need to migrate schema
            recreate = False
            try:
                ix = open_dir(INDEX_DIR)
                # Verify fields exist
                if 'published_date' not in ix.schema.names():
                    raise Exception("Schema mismatch: missing published_date")
                
                # Check if authority_score is NUMERIC(int)
                auth_field = ix.schema['authority_score']
                if not isinstance(auth_field, NUMERIC) or auth_field.numtype != int:
                    print("⚠️ Schema Mismatch: authority_score is not int. Recreating index...")
                    recreate = True
                
                if not recreate:
                    print(f"Loaded existing index from {INDEX_DIR}")
            except Exception as e:
                print(f"⚠️ Schema mismatch detected ({e}). Recreating index...")
                recreate = True
            
            if recreate:
                import shutil
                try:
                    shutil.rmtree(INDEX_DIR)
                except FileNotFoundError:
                    pass
                os.makedirs(INDEX_DIR)
                create_in(INDEX_DIR, schema)
        
        # CRITICAL: Open index for searcher to use
        self.ix = open_dir(INDEX_DIR)

    def add_document(self, title, url, content, snippet=None, image_url=None, published_date=None, authority_score=0.0):
        """Adds or updates a document in the index."""
        try:
            if not title or not isinstance(title, str) or len(title.strip()) == 0:
                print(f"Skipping {url}: Empty or invalid title")
                return False
            
            if not content or not isinstance(content, str) or len(content.strip()) < 100:
                print(f"Skipping {url}: Empty or too short content ({len(content) if content else 0} chars)")
                return False
            
            if not url or not isinstance(url, str):
                print(f"Skipping: Invalid URL")
                return False

            # Check if URL exists to update or add
            writer = self.ix.writer()
            
            # Ensure snippet length
            if snippet and len(snippet) > 300:
                snippet = snippet[:297] + "..."
            
            # Parse Date if string
            if isinstance(published_date, str):
                try:
                    if not published_date.strip():
                        published_date = None
                    else:
                        published_date = datetime.fromisoformat(published_date.replace('Z', '+00:00'))
                except:
                    published_date = None
            elif not isinstance(published_date, datetime):
                published_date = None

            # Force scaled int for authority_score to avoid struct packing errors
            try:
                authority_score = int(float(authority_score) * 10000)
            except (ValueError, TypeError):
                authority_score = 0
            
            for attempt in range(5):
                try:
                    writer.update_document(
                        title=title,
                        url=url,
                        content=content,
                        snippet=snippet,
                        image_url=image_url,
                        published_date=published_date,
                        authority_score=authority_score
                    )
                    writer.commit()
                    return True
                except LockError:
                    time.sleep(0.1)
                except Exception as e:
                    print(f"Indexing error for {url}: {e}")
                    print(f"DEBUG types: Date={type(published_date)}, Auth={type(authority_score)}")
                    writer.cancel()
                    return False
            return False
        except Exception as e:
            print(f"General Error adding document {url}: {e}")
            return False


    def url_exists(self, url):
        """Checks if a URL is already indexed."""
        try:
            ix = open_dir(INDEX_DIR)
            with ix.searcher() as searcher:
                from whoosh.query import Term
                results = searcher.search(Term("url", url), limit=1)
                return len(results) > 0
        except:
            return False

    def calculate_authority_score(self, url):
        """Calculate static domain authority score."""
        score = 0.0
        domain = url.lower()
        
        # Trusted TLDs
        if '.gov' in domain: score += 0.3
        if '.edu' in domain: score += 0.2
        
        # High Authority Domains
        high_auth = [
            'wikipedia.org', 'github.com', 'stackoverflow.com', 'medium.com',
            'reddit.com', 'bbc.com', 'nytimes.com', 'reuters.com',
            'nasa.gov', 'who.int', 'nature.com', 'sciencedirect.com'
        ]
        if any(d in domain for d in high_auth):
            score += 0.5
            
        return min(1.0, score)

    def calculate_quality_score(self, title: str, snippet: str, url: str) -> float:
        """
        Calculate content quality score (0.0 - 1.0).
        Higher scores = higher quality content.
        """
        score = 0.5  # Base score
        
        # === TITLE QUALITY ===
        if title:
            title_len = len(title)
            # Optimal title length: 30-60 chars
            if 30 <= title_len <= 60:
                score += 0.1
            elif title_len < 10 or title_len > 100:
                score -= 0.1
            
            # Penalize generic/low-quality titles
            low_quality_titles = [
                'untitled', 'home', 'index', 'page', 'document', 
                'error', '404', '403', 'not found', 'loading'
            ]
            if title.lower().strip() in low_quality_titles:
                score -= 0.3
        else:
            score -= 0.2  # No title = low quality
        
        # === SNIPPET/CONTENT QUALITY ===
        if snippet:
            snippet_len = len(snippet)
            # Good snippets are 100-300 chars
            if 100 <= snippet_len <= 300:
                score += 0.1
            elif snippet_len < 50:
                score -= 0.1
            
            # Check for meaningful content (has sentences)
            if '. ' in snippet or '? ' in snippet or '! ' in snippet:
                score += 0.05
        else:
            score -= 0.2  # No snippet = low quality
        
        # === URL QUALITY ===
        url_lower = url.lower()
        
        # Penalize very long URLs (often dynamic/session pages)
        if len(url) > 200:
            score -= 0.1
        
        # Penalize URLs with lots of numbers (often IDs, not content)
        import re
        num_count = len(re.findall(r'\d+', url))
        if num_count > 5:
            score -= 0.05
        
        # Boost clean, readable URLs
        if re.match(r'^https?://[a-zA-Z0-9.-]+/[a-zA-Z0-9-/]+$', url):
            score += 0.05
        
        # === DOMAIN QUALITY BONUS ===
        quality_domains = [
            'wikipedia.org', 'stackoverflow.com', 'github.com',
            'mozilla.org', 'python.org', 'microsoft.com', 'google.com',
            'bbc.com', 'nytimes.com', 'reuters.com', 'techcrunch.com'
        ]
        if any(d in url_lower for d in quality_domains):
            score += 0.1
        
        # Clamp to 0.0 - 1.0
        return max(0.0, min(1.0, score))

    def search(self, query: str, page=1, per_page=10, date_filter=None, source_filter=None):
        """Searches with Google-like Intelligence (Intent, Synonyms, Authority, Recency)."""
        # Generate cache key
        cache_key = hashlib.md5(
            f"{query}_{page}_{per_page}_{date_filter}_{source_filter}".encode()
        ).hexdigest()
        
        # Check cache
        if cache_key in self.query_cache:
            cached_result, cached_time = self.query_cache[cache_key]
            if time.time() - cached_time < self.cache_ttl:
                self.cache_hits += 1
                return cached_result
            else:
                # Expired, remove
                del self.query_cache[cache_key]
        
        self.cache_misses += 1
        
        # Cache cleanup when reaching max size (LRU-style)
        if len(self.query_cache) >= self.cache_max_size:
            # Remove oldest 20% of cache entries
            sorted_keys = sorted(
                self.query_cache.keys(),
                key=lambda k: self.query_cache[k][1]
            )
            for old_key in sorted_keys[:int(self.cache_max_size * 0.2)]:
                del self.query_cache[old_key]
        
        start_time = time.time()
        
        try:
            # Refresh searcher to see newly indexed documents
            self.searcher = self.searcher.refresh()
            searcher = self.searcher
            
            # 1. INTELLIGENCE: Detect Intent
            intents = self.intent_classifier.classify(query)
            is_news = 'news' in intents
            is_technical = 'technical' in intents
            
            # 2. INTELLIGENCE: Expand Synonyms
            # Only expand if not a strict quote search
            if '"' not in query:
                expanded_query_str = self.synonym_expander.expand(query)
            else:
                expanded_query_str = query
                
            # 3. Parse Query
            
            # --- ADVANCED OPERATORS PREPROCESSING ---
            def preprocess_query(q):
                # Handle site:operator (convert to url field query)
                # Note: Whoosh doesn't support prefix queries on ID fields easily in standard parser
                # So we manually handle it or rely on content if URL is indexed there.
                # However, for simplicity and effectiveness, we can use wildcards if supported.
                
                parts = q.split()
                new_parts = []
                site_filter = None
                
                for part in parts:
                    if part.startswith('site:'):
                        domain = part.split(':', 1)[1]
                        # Use wildcards for partial URL match
                        new_parts.append(f"url:*{domain}*")
                    elif part.startswith('intitle:'):
                        term = part.split(':', 1)[1]
                        new_parts.append(f"title:{term}")
                    elif part.startswith('filetype:'):
                        ext = part.split(':', 1)[1]
                        new_parts.append(f"url:*.{ext}")
                    else:
                        new_parts.append(part)
                
                return " ".join(new_parts)

            final_query_str = preprocess_query(query)
            
            # Only expand synonyms if NO advanced operators present (to avoid messing up precise queries)
            has_operators = any(op in query for op in ['site:', 'intitle:', 'filetype:', '"', ':'])
            
            if not has_operators:
                 # Expand Query for synonyms
                 expanded_query_str = self.synonym_expander.expand(final_query_str)
            else:
                 expanded_query_str = final_query_str
            
            # 3. Parse Query with Field Weighting
            from whoosh.query import Or, Phrase, Term
            # BOOST TITLE: Matches in title are 4x more important
            # Use OrGroup (Parser logic) for grouping terms, not Or (Query logic)
            # Add 'url' to fields so site: operator works
            parser = MultifieldParser(["title", "content", "url"], schema=self.ix.schema, fieldboosts={"title": 4.0, "content": 1.0}, group=OrGroup)
            my_query = parser.parse(expanded_query_str)
            
            # Phrase Boosting: Check for exact phrase matches (Only if no explicit quotes already)
            try:
                 if '"' not in query and len(query.split()) > 1 and not has_operators:
                     phrase_q = Phrase("content", query.split())
                     my_query = Or([my_query, phrase_q], boost=2.0)
            except:
                pass

            # 4. Execute Search
            results = searcher.search_page(my_query, page, pagelen=per_page * 2) # Fetch more for deduplication
            
            seen_titles = set()
            result_list = []
            
            # Helper for similarity (simple Jaccard for speed)
            def is_similar(s1, s2):
                set1 = set(s1.lower().split())
                set2 = set(s2.lower().split())
                intersection = len(set1.intersection(set2))
                union = len(set1.union(set2))
                return (intersection / union) > 0.8 if union > 0 else False

            valid_hits = []
            for hit in results:
                title = hit.get("title", "")
                is_dup = False
                for seen in seen_titles:
                     if is_similar(title, seen):
                         is_dup = True
                         break
                
                if not is_dup:
                    seen_titles.add(title)
                    valid_hits.append(hit)
                    if len(valid_hits) >= per_page:
                        break
            
            for hit in valid_hits:
                url = hit.get("url", "")
                
                # --- ADVANCED SCORING FORMULA ---
                
                # Base Scores
                bm25f_score = hit.score
                pagerank_score = self.pagerank_scores.get(url, 0.0)
                authority_score = hit.get("authority_score", 0.0)
                # Normalize scaled int back to 0.0-1.0 float
                authority_score = float(authority_score) / 10000.0
                
                # Normalize BM25F (approximate)
                normalized_bm25f = min(bm25f_score / 50.0, 1.0)
                
                # Recency Score
                recency_score = 0.0
                pub_date = hit.get("published_date")
                if pub_date:
                    try:
                        # Calculate days since publication
                        days_old = (datetime.now() - pub_date).days
                        if days_old < 0: days_old = 0
                        
                        # Decay function: 1.0 for today, 0.5 for 1 year old
                        recency_score = 1.0 / (1.0 + (days_old / 365.0))
                    except:
                        pass
                
                # Weighting Factors (Relevancy-First Approach)
                w_relevance = 0.65  # Content match is king
                w_pagerank = 0.12   # Popularity helps
                w_authority = 0.08  # Domain trust
                w_recency = 0.05    # Freshness
                w_quality = 0.10    # Content quality
                
                # Adjust weights based on Intent
                if is_news:
                    w_recency = 0.35
                    w_relevance = 0.40
                    w_authority = 0.10
                    w_pagerank = 0.10
                    w_quality = 0.05
                elif is_technical:
                    w_relevance = 0.70  # Precision matters most
                    w_authority = 0.10
                    w_recency = 0.05
                    w_quality = 0.10
                    w_pagerank = 0.05
                
                # Calculate quality score
                title = hit.get("title", "")
                snippet_raw = hit.get("snippet", "")
                quality_score = self.calculate_quality_score(title, snippet_raw, url)
                
                final_score = (
                    (w_relevance * normalized_bm25f) +
                    (w_pagerank * pagerank_score) +
                    (w_authority * authority_score) +
                    (w_recency * recency_score) +
                    (w_quality * quality_score)
                )
                
                # --- SEARCH ANALYTICS BOOST ---
                # Boost based on User Clicks (Self-Learning)
                try:
                     from click_tracker import tracker
                     click_boosts = tracker.get_boost_map(query)
                     if url in click_boosts:
                         boost_factor = click_boosts[url]
                         # Apply boost (Max 1.5x)
                         final_score *= boost_factor
                         # Also slightly boost rank to ensure it potentially jumps
                except Exception as e:
                    pass # Fail silently, don't break search
                
                # Generate Relevant Snippet (Highlighting)
                title = hit.get("title", "Untitled")
                snippet = hit.highlights("content", top=2) # Get top 2 relevant fragments
                if not snippet:
                     # Fallback to first 200 chars if no highlight found
                    snippet = hit.get("content", "")[:200] + "..."
                else:
                    # Clean up HTML tags if Whoosh adds them (it usually adds <b>...</b>)
                    # For now keep them as they might be useful, or strip them if UI handles it.
                    # Let's strip them to be safe and let UI handle bolding if needed, 
                    # or better: keep them and let frontend utilize `dangerouslySetInnerHTML` or similar if we wanted bolding.
                    # Ideally, we want clean text.
                    import re
                    snippet = re.sub('<[^<]+?>', '', snippet)
                
                # Featured Snippet Detection (Aggressive/Always-On for Questions)
                is_featured = False
                
                # Check if query is a question
                question_words = ['what', 'who', 'how', 'when', 'where', 'why', 'can', 'does', 'is', 'are']
                is_question = any(query.strip().lower().startswith(q) for q in question_words)
                
                if hit.rank == 0:
                     # If it's a question, be very aggressive (threshold 0.4)
                     if is_question and final_score > 0.4 and len(snippet) < 500:
                         is_featured = True
                     # If not a question, still try relatively aggressive (threshold 0.6)
                     elif final_score > 0.6 and len(snippet) < 450:
                         # Check for answer patterns
                         answer_indicators = ['is', 'are', 'means', 'defined', 'stands for', 'refers to', 'consists of', 'used for']
                         if any(t in snippet.lower() for t in answer_indicators):
                             is_featured = True

                # Freshness Badge
                freshness_badge = None
                if pub_date:
                    days_old = (datetime.now() - pub_date).days
                    if days_old <= 1:
                        freshness_badge = "🆕 Just now"
                    elif days_old <= 7:
                        freshness_badge = "🆕 This week"
                    elif days_old <= 30:
                        freshness_badge = "📅 This month"
                    elif days_old > 365 * 2:
                        freshness_badge = "⚠️ May be outdated"

                result_list.append({
                    "title": title,
                    "url": url,
                    "snippet": snippet,
                    "score": final_score * 100,
                    "pagerank": pagerank_score,
                    "image": hit.get("image_url", ""),
                    "date": pub_date.isoformat() if pub_date else None,
                    "authority": authority_score,
                    "is_featured": is_featured,
                    "freshness_badge": freshness_badge
                })
            
            # --- SOURCE DIVERSITY: Max 2 results per domain ---
            def get_domain(url):
                try:
                    from urllib.parse import urlparse
                    return urlparse(url).netloc.replace('www.', '')
                except:
                    return url
            
            domain_counts = {}
            diverse_results = []
            for result in result_list:
                domain = get_domain(result['url'])
                if domain_counts.get(domain, 0) < 2:
                    diverse_results.append(result)
                    domain_counts[domain] = domain_counts.get(domain, 0) + 1
            
            result_list = diverse_results
            
            # --- SEMANTIC SCORING ---
            try:
                from semantic_search import semantic_searcher
                result_list = semantic_searcher.score_results(query, result_list, weight=0.2)
            except Exception as e:
                pass  # Fail silently, use original scores
            
            # Re-rank by final hybrid score
            result_list.sort(key=lambda x: x.get('hybrid_score', x.get('score', 0)), reverse=True)
            
            print(f"🔍 SEARCH DEBUG: Query='{query}' | Found={len(result_list)} hits | Page={page}")
            
            response = {
                "results": result_list,
                "count": len(result_list),
                "total": results.total,
                "page": page,
                "per_page": per_page,
                "total_pages": (results.total + per_page - 1) // per_page,
                "intents": intents # Debug info
            }
            
            self.query_cache[cache_key] = (response, time.time())
            
            # Clean cache
            if len(self.query_cache) > 1000:
                sorted_cache = sorted(self.query_cache.items(), key=lambda x: x[1][1])
                for key, _ in sorted_cache[:200]:
                    del self.query_cache[key]
            
            return response
            
        except Exception as e:
            print(f"Search error: {e}")
            return {
                "results": [],
                "count": 0,
                "total": 0,
                "page": page,
                "per_page": per_page,
                "total_pages": 0
            }
    
    def _fast_snippet(self, content: str, query: str, max_len: int = 200) -> str:
        """Generate clean, readable snippet with aggressive noise filtering."""
        if not content:
            return ""
        
        # Aggressive cleaning for GitHub/StackOverflow noise
        content = re.sub(r'https?://\S+', '', content)
        content = re.sub(r'\b\d{1,2}(st|nd|rd|th)?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4}\b', '', content, flags=re.I)
        content = re.sub(r'\b\w+\s+\d{1,2}\s+at\s+\d{1,2}:\d{2}\b', '', content)
        content = re.sub(r'\b(opened|asked|answered|edited|closed|merged)\s+(on|at)?\s*\w+\s+\d+', '', content, flags=re.I)
        content = re.sub(r'\b\w{3,12}(opened|closed|merged|labeled)\w+\b', '', content, flags=re.I)
        content = re.sub(r'\b\w+:\w+(\s+\w+:\w+)*\b', '', content)
        content = re.sub(r'\s+', ' ', content).strip()
        
        query_lower = query.lower()
        content_lower = content.lower()
        query_pos = content_lower.find(query_lower)
        
        if query_pos != -1:
            start = max(0, query_pos - 100)
            end = min(len(content), query_pos + 150)
            snippet = content[start:end]
            
            if start > 0:
                first_space = snippet.find(' ')
                if first_space > 0 and first_space < 30:
                    snippet = snippet[first_space+1:]
                snippet = "..." + snippet
            
            if end < len(content):
                last_period = snippet.rfind('.')
                if last_period > 100:
                    snippet = snippet[:last_period+1]
                else:
                    snippet = snippet + "..."
        else:
            sentences = re.split(r'[.!?]\s+', content)
            snippet = ""
            for sent in sentences[:3]:
                if len(sent) > 20 and len(snippet) + len(sent) < max_len:
                    snippet += sent + ". "
            
            if not snippet:
                snippet = content[:max_len] + "..."
        
        snippet = snippet.strip()
        snippet = re.sub(r'\b\w+(opened|closed|asked|answered)\w+\b', '', snippet, flags=re.I)
        snippet = re.sub(r'\s+', ' ', snippet).strip()
        
        if len(snippet) < 30 or snippet.count(' ') < 3:
            clean_start = content[:max_len]
            if clean_start:
                snippet = clean_start + "..."
        
        return snippet
    

    def get_autocomplete(self, query: str, limit=6):
        """Get autocomplete suggestions - predictive & optimized."""
        try:
            if len(query) < 2:
                return []
            
            suggestions = []
            seen = set()
            query_lower = query.lower()

            # 1. Get from Trending/History (Highest Quality)
            trending_data = trending_tracker.get_trending(limit=50) # Get more to filter
            for item in trending_data:
                q_text = item['query'].lower()
                if q_text.startswith(query_lower) and q_text not in seen:
                    suggestions.append(q_text)
                    seen.add(q_text)
            
            # If we have enough from trending, return early
            if len(suggestions) >= limit:
                return suggestions[:limit]

            # 2. Get from Index (Fallback)
            with self.ix.searcher() as searcher:
                from whoosh.query import Prefix
                
                # Search titles
                q = Prefix("title", query.lower())
                hits = searcher.search(q, limit=limit * 3)
                
                for hit in hits:
                    if len(suggestions) >= limit: break
                    
                    raw_title = hit.get("title", "")
                    
                    # CLEANING LOGIC: Convert Title -> Query
                    # Remove common SEO suffixes
                    clean = re.sub(r'\s*[-|:]\s*.*$', '', raw_title) # Remove " - Wikipedia", " | IGN"
                    clean = re.sub(r'\(.*?\)', '', clean) # Remove parentheses content "(programming language)"
                    clean = clean.strip().lower()
                    
                    # Remove extra whitespace
                    clean = ' '.join(clean.split())
                    
                    # Skip if it's too short (garbage) or identical to query
                    if len(clean) < 3 or clean == query_lower:
                        continue
                        
                    if clean.startswith(query_lower) and clean not in seen:
                        suggestions.append(clean)
                        seen.add(clean)
                           
            return suggestions[:limit]
            
        except Exception as e:
            print(f"Autocomplete error: {e}")
            return []
    
    def get_spell_suggestion(self, query: str):
        """Get spell-corrected suggestion if query has typos."""
        try:
            import difflib
            if len(query) < 3:
                return None
            
            ix = open_dir(INDEX_DIR)
            with ix.searcher() as searcher:
                reader = searcher.reader()
                all_words = set()
                for field in ["title", "content"]:
                    words = list(reader.field_terms(field))
                    all_words.update([w.decode() if isinstance(w, bytes) else w for w in words[:1000]])
                
                query_words = query.lower().split()
                corrected_words = []
                has_correction = False
                
                for word in query_words:
                    if len(word) < 3:
                        corrected_words.append(word)
                        continue
                    matches = difflib.get_close_matches(word, all_words, n=1, cutoff=0.8)
                    if matches and matches[0] != word:
                        corrected_words.append(matches[0])
                        has_correction = True
                    else:
                        corrected_words.append(word)
                
                if has_correction:
                    return " ".join(corrected_words)
            return None
        except Exception as e:
            print(f"Spell check error: {e}")
            return None



    def get_stats(self):
        try:
            ix = open_dir(INDEX_DIR)
            with ix.searcher() as s:
                return {"doc_count": s.doc_count()}
        except:
            return {"doc_count": 0}
