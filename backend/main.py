from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from search_engine import SearchEngine
from trending import tracker as trending_tracker
from instant_answers import instant_answers
from related_searches import related_searches
from crawler import Crawler
import asyncio
import os

app = FastAPI(
    title="Erlandx Search API",
    description="Smart Search Engine with Instant Answers",
    version="1.0.0"
)

# CORS Middleware - Use environment variable for production
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Engine
engine = SearchEngine()

class SearchRequest(BaseModel):
    query: str
    page: int = 1
    per_page: int = 10
    date_filter: Optional[str] = None
    source_filter: Optional[str] = None
    tab: Optional[str] = "all"  # all, news
    exact_match: Optional[bool] = False

class CrawlRequest(BaseModel):
    url: str
    depth: int = 2

@app.get("/")
def root():
    stats = engine.get_stats()
    return {
        "status": "online",
        "system": "Erlandx Pure Search",
        "indexed_pages": stats.get("doc_count", 0)
    }

@app.post("/search")
def search(request: SearchRequest):
    """Search endpoint with pagination and filters support."""
    # Track query for trending (privacy: query only, no user data)
    trending_tracker.track_query(request.query)
    
    # --- NLU: Parse natural language query ---
    try:
        from query_parser import query_parser
        parsed = query_parser.parse(request.query)
        
        # Auto-apply time filter from NLU if not explicitly set
        date_filter = request.date_filter
        if not date_filter and parsed.get('time_filter'):
            date_filter = parsed['time_filter']
        
        # Use clean query (time phrases removed) for search
        search_query = parsed.get('clean_query', request.query)
        
        # Auto-apply site filter from NLU
        source_filter = request.source_filter
        if not source_filter and parsed.get('site_filter'):
            source_filter = parsed['site_filter']
    except Exception as e:
        print(f"NLU parsing error: {e}")
        search_query = request.query
        date_filter = request.date_filter
        source_filter = request.source_filter
        parsed = {}
    
    # Query expansion with common synonyms
    expanded_query = expand_query(search_query)
    
    results = engine.search(
        expanded_query, 
        page=request.page,
        per_page=request.per_page,
        date_filter=date_filter,
        source_filter=source_filter
    )
    
    # Add spell suggestion
    spell_suggestion = engine.get_spell_suggestion(request.query)
    if spell_suggestion and spell_suggestion != request.query:
        results["spell_suggestion"] = spell_suggestion
    
    # Add original query for reference
    results["original_query"] = request.query
    if expanded_query != request.query:
        results["expanded_query"] = expanded_query
    
    return results

def expand_query(query: str) -> str:
    """Advanced query understanding like Google/DuckDuckGo."""
    import re
    
    original_query = query
    query_lower = query.lower().strip()
    
    # 1. ENTITY DETECTION - Preserve important entities
    entities = {
        # Programming languages
        'python': 'python programming language',
        'javascript': 'javascript programming',
        'java': 'java programming',
        'c++': 'cpp programming',
        'rust': 'rust programming language',
        
        # Frameworks/Tools
        'react': 'reactjs react.js',
        'vue': 'vuejs vue.js',
        'angular': 'angularjs angular framework',
        'django': 'django python framework',
        'flask': 'flask python',
        'tensorflow': 'tensorflow machine learning',
        'pytorch': 'pytorch deep learning',
        
        # Technologies
        'blockchain': 'blockchain cryptocurrency',
        'machine learning': 'ml ai artificial intelligence',
        'docker': 'docker container',
        'kubernetes': 'k8s kubernetes orchestration',
        'git': 'git version control',
        
        # Companies/Products
        'google': 'google search alphabet',
        'microsoft': 'microsoft windows',
        'apple': 'apple mac ios',
        'amazon': 'amazon aws',
        'netflix': 'netflix streaming',
    }
    
    # 2. QUESTION PATTERNS - Detect user intent
    question_patterns = {
        # How-to (tutorial intent)
        r'^(how (do i|to|can i|does|is)|bagaimana|gimana|cara)': {
            'intent': 'tutorial',
            'keywords': ('tutorial', 'guide', 'step-by-step', 'how-to')
        },
        
        # What is (definition intent)
        r'^(what (is|are|does)|apa (itu|yang))': {
            'intent': 'definition',
            'keywords': ('definition', 'explanation', 'meaning', 'introduction')
        },
        
        # Where (location/download intent)
        r'^(where (can i|to|is)|di mana|dimana)': {
            'intent': 'location',
            'keywords': ('location', 'download', 'find', 'get', 'where')
        },
        
        # Why (reason/explanation)
        r'^(why|mengapa|kenapa)': {
            'intent': 'reason',
            'keywords': ('reason', 'why', 'because', 'explanation')
        },
        
        # When (time/history)
        r'^(when|kapan)': {
            'intent': 'time',
            'keywords': ('when', 'time', 'date', 'history')
        },
        
        # Which/Best (comparison intent)
        r'^(which|best|top|mana yang|terbaik)': {
            'intent': 'comparison',
            'keywords': ('comparison', 'best', 'top', 'vs', 'better', 'recommended')
        },
        
        # Who (person/creator)
        r'^(who|siapa)': {
            'intent': 'person',
            'keywords': ('who', 'person', 'creator', 'founder', 'developer')
        },
    }
    
    # 3. PHRASE RECOGNITION - Multi-word important terms
    phrases = [
        'machine learning', 'deep learning', 'artificial intelligence',
        'web development', 'mobile development', 'software engineering',
        'data science', 'data analysis', 'big data',
        'cloud computing', 'edge computing', 'quantum computing',
        'cyber security', 'information security',
        'open source', 'version control', 'continuous integration',
        'neural network', 'computer vision', 'natural language processing',
    ]
    
    # Preserve multi-word phrases
    preserved_query = query_lower
    for phrase in phrases:
        if phrase in query_lower:
            # Mark phrase to not break apart
            preserved_query = preserved_query.replace(phrase, phrase.replace(' ', '_'))
    
    # 4. DETECT QUESTION TYPE AND EXTRACT TOPIC
    topic = preserved_query
    intent_info = None
    
    for pattern, info in question_patterns.items():
        if re.search(pattern, query_lower):
            intent_info = info
            # Remove question words
            topic = re.sub(pattern, '', preserved_query).strip()
            break
    
    # 5. REMOVE STOP WORDS (but keep important context)
    stop_words = {
        'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'from',
        'yang', 'di', 'ke', 'dari', 'untuk', 'dengan', 'ini', 'itu', 'dan', 'atau'
    }
    topic_words = [w for w in topic.split() if w not in stop_words or '_' in w]
    clean_topic = ' '.join(topic_words).replace('_', ' ')
    
    # 6. ENTITY EXPANSION
    expanded_entities = []
    for entity, expansion in entities.items():
        if entity in clean_topic.lower():
            expanded_entities.append(expansion)
    
    # 7. BUILD FINAL QUERY
    if intent_info and clean_topic:
        # Question query: topic + intent keywords + entities
        parts = [clean_topic]
        parts.extend(intent_info['keywords'])
        parts.extend(expanded_entities)
        expanded = ' '.join(parts)
    elif clean_topic != query_lower:
        # Topic extracted but no question - add entities
        parts = [clean_topic]
        parts.extend(expanded_entities)
        expanded = ' '.join(parts) if expanded_entities else clean_topic
    else:
        # Regular keyword query - minimal expansion
        expanded = original_query
        
        # Add common synonyms only for short queries
        if len(query.split()) <= 3:
            quick_synonyms = {
                'best': 'top recommended',
                'free': 'gratis open-source',
                'learn': 'tutorial course',
                'download': 'install get',
                'fix': 'solve repair',
            }
            for term, syn in quick_synonyms.items():
                if term in query_lower:
                    expanded = f"{original_query} {syn}"
                    break
    
    return expanded


@app.get("/autocomplete")
def autocomplete(q: str):
    """Autocomplete endpoint for search suggestions."""
    if len(q) < 2:
        return {"suggestions": []}
    
    suggestions = engine.get_autocomplete(q, limit=5)
    return {"suggestions": suggestions}

@app.get("/api/trending")
def get_trending():
    """Get trending/popular searches."""
    trending = trending_tracker.get_trending(limit=10)
    return {"trending": trending}

@app.get("/api/instant-answer")
def get_instant_answer(q: str):
    """Get instant answer for query (calculator, converter, etc)."""
    answer = instant_answers.get_answer(q)
    if answer:
        return {"answer": answer}
    return {"answer": None}

@app.get("/api/related-searches")
def get_related_searches(q: str):
    """Get related search suggestions."""
    related = related_searches.generate(q, limit=6)
    return {"related": related}


@app.post("/crawl")
async def crawl(request: CrawlRequest):
    crawler = Crawler(engine)
    await crawler.start_crawl(request.url, request.depth)
    return {"status": "Crawl completed", "url": request.url}

@app.post("/crawl/auto")
async def auto_crawl():
    crawler = Crawler(engine)
    await crawler.start_auto_crawl()
    return {"status": "Auto-crawl completed"}

@app.get("/api/knowledge-panel")
def get_knowledge_panel(q: str):
    """Fetch rich knowledge panel data from Wikipedia with infobox parsing."""
    import httpx
    import re
    from bs4 import BeautifulSoup
    
    if not q or len(q.strip()) < 2:
        return {"found": False}
    
    # Try Wikipedia first
    try:
        query = q.strip().title()
        
        # Fetch Wikipedia page HTML for infobox data
        wiki_page_url = f"https://en.wikipedia.org/wiki/{query.replace(' ', '_')}"
        wiki_api_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{query.replace(' ', '_')}"
        
        headers = {
            "User-Agent": "ErlandxBot/1.0 (Educational Search Engine; +https://erlandx.com)",
            "Accept": "application/json, text/html"
        }
        
        with httpx.Client(timeout=5.0, headers=headers, follow_redirects=True) as client:
            # Get summary from API
            api_response = client.get(wiki_api_url)
            
            if api_response.status_code != 200:
                # Fallback to indexed data
                raise Exception("Wikipedia API failed")
            
            api_data = api_response.json()
            
            # Get full page HTML for infobox
            page_response = client.get(wiki_page_url)
            infobox_data = {}
            
            if page_response.status_code == 200:
                soup = BeautifulSoup(page_response.text, 'lxml')
                
                # Extract infobox (Wikipedia's structured data table)
                infobox = soup.find('table', class_='infobox')
                
                if infobox:
                    rows = infobox.find_all('tr')
                    for row in rows:
                        # Look for header + data pairs
                        header = row.find('th')
                        data = row.find('td')
                        
                        if header and data:
                            label = header.get_text(strip=True)
                            value = data.get_text(strip=True)
                            
                            # Clean up value (remove citations like [1], [2])
                            value = re.sub(r'\[\d+\]', '', value)
                            value = ' '.join(value.split())  # Normalize whitespace
                            
                            if label and value and len(value) < 200:  # Skip very long values
                                infobox_data[label] = value
            
            # Type detection
            panel_type = "concept"
            description = api_data.get("description", "").lower()
            if any(word in description for word in ["person", "actor", "singer", "ceo", "entrepreneur", "politician", "scientist"]):
                panel_type = "person"
            elif any(word in description for word in ["city", "country", "place", "location", "state"]):
                panel_type = "place"
            elif any(word in description for word in ["company", "corporation", "organization", "business"]):
                panel_type = "organization"
            
            # Build facts array from infobox
            facts = []
            
            # Add description first
            if api_data.get("description"):
                facts.append({
                    "label": "Type",
                    "value": api_data["description"].title()
                })
            
            # Add infobox data (Exhaustive Scrape)
            if infobox:
                rows = infobox.find_all('tr')
                for row in rows:
                    if len(facts) >= 12: break # Limit to avoid clutter
                    
                    header = row.find('th')
                    data = row.find('td')
                    
                    if header and data:
                        # Clean Label
                        label = header.get_text(" ", strip=True)
                        # Remove citation brackets like [1]
                        label = re.sub(r'\[.*?\]', '', label).strip()
                        
                        # Clean Value
                        # Replace <br> with commas for list-like values
                        for br in data.find_all('br'):
                            br.replace_with(', ')
                        for li in data.find_all('li'):
                            li.insert_after(', ')
                            
                        value = data.get_text(" ", strip=True)
                        value = re.sub(r'\[.*?\]', '', value) # Remove citations
                        value = re.sub(r'\s+,', ',', value)   # Fix spaces before commas
                        value = re.sub(r',\s*,', ',', value)  # Fix double commas
                        value = value.strip().strip(',')
                        
                        # Skip website row (handled separately) or empty
                        if 'website' in label.lower() or not value:
                            continue
                            
                        facts.append({
                            "label": label,
                            "value": value
                        })
            
            # Extract quick links (social media, official site)
            quick_links = []
            
            # Add Wikipedia link
            quick_links.append({
                "name": "Wikipedia",
                "url": api_data.get("content_urls", {}).get("desktop", {}).get("page", wiki_page_url),
                "icon": "wikipedia"
            })
            
            # Try to find official website from infobox
            if infobox:
                website_row = infobox.find('th', string=re.compile(r'Website', re.I))
                if website_row:
                    website_data = website_row.find_next('td')
                    if website_data:
                        link = website_data.find('a', href=True)
                        if link:
                            quick_links.append({
                                "name": "Official Website",
                                "url": link['href'],
                                "icon": "globe"
                            })
            
            # Fetch Related/Similar Pages via Opensearch (since /related is deprecated)
            related_topics = []
            try:
                wiki_title = api_data.get("title", "").replace(" ", "_")
                if wiki_title:
                    # Use Opensearch to find similar/related completions
                    related_url = f"https://en.wikipedia.org/w/api.php?action=opensearch&search={wiki_title}&limit=5&namespace=0&format=json"
                    related_response = client.get(related_url)
                    
                    if related_response.status_code == 200:
                        related_data = related_response.json()
                        # Opensearch format: [query, [Titles], [Descriptions], [URLs]]
                        if len(related_data) >= 4:
                            titles = related_data[1]
                            urls = related_data[3]
                            
                            for i in range(1, len(titles)): # Skip first (it's usually the query itself)
                                if len(related_topics) >= 4: break
                                related_topics.append({
                                    "title": titles[i],
                                    "url": urls[i],
                                    "image": None # Opensearch doesn't return images, but it's fast/stable
                                })
            except Exception as e:
                print(f"Related pages error: {e}")
            except Exception as e:
                print(f"Related pages error: {e}")

            return {
                "found": True,
                "title": api_data.get("title", query),
                "type": panel_type,
                "summary": api_data.get("extract", "")[:400] + "..." if len(api_data.get("extract", "")) > 400 else api_data.get("extract", ""),
                "image": api_data.get("thumbnail", {}).get("source") if api_data.get("thumbnail") else api_data.get("originalimage", {}).get("source"),
                "facts": facts[:20],  # Limit to 20 facts
                "quickLinks": quick_links,
                "source": "Wikipedia",
                "sourceUrl": api_data.get("content_urls", {}).get("desktop", {}).get("page", ""),
                "relatedTopics": related_topics
            }
            
    except Exception as e:
        print(f"Wikipedia API error: {e}")
    
    # Fallback: Use indexed data
    try:
        results = engine.search(q, page=1, per_page=1)
        
        if results.get("results") and len(results["results"]) > 0:
            top_result = results["results"][0]
            
            from urllib.parse import urlparse
            domain = urlparse(top_result["url"]).netloc
            source_name = domain.replace("www.", "").split(".")[0].title()
            
            return {
                "found": True,
                "title": top_result["title"],
                "type": "indexed",
                "summary": top_result["snippet"],
                "image": None,
                "facts": [
                    {"label": "Source", "value": domain},
                    {"label": "Relevance", "value": f"{int(top_result.get('score', 0) * 100)}%"}
                ],
                "quickLinks": [
                    {"name": "Visit Site", "url": top_result["url"], "icon": "globe"}
                ],
                "source": source_name,
                "sourceUrl": top_result["url"]
            }
    except Exception as e:
        print(f"Index fallback error: {e}")
    
    return {"found": False}

@app.get("/api/weather")
async def get_weather(location: str):
    """Get weather data for a location using Open-Meteo API."""
    try:
        import httpx
        
        # Step 1: Geocode location to get coordinates
        geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={location}&count=1&language=en&format=json"
        async with httpx.AsyncClient() as client:
            geo_response = await client.get(geo_url)
            geo_data = geo_response.json()
            
            if not geo_data.get("results"):
                return {"found": False, "error": "Location not found"}
            
            result = geo_data["results"][0]
            lat = result["latitude"]
            lon = result["longitude"]
            city_name = result["name"]
            country = result.get("country", "")
            
            # Step 2: Get weather data
            weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=3"
            weather_response = await client.get(weather_url)
            weather_data = weather_response.json()
            
            current = weather_data["current"]
            daily = weather_data["daily"]
            
            # Map weather codes to icons/descriptions
            weather_codes = {
                0: {"desc": "Clear sky", "icon": "☀️"},
                1: {"desc": "Mainly clear", "icon": "🌤️"},
                2: {"desc": "Partly cloudy", "icon": "⛅"},
                3: {"desc": "Overcast", "icon": "☁️"},
                45: {"desc": "Foggy", "icon": "🌫️"},
                48: {"desc": "Foggy", "icon": "🌫️"},
                51: {"desc": "Light drizzle", "icon": "🌦️"},
                61: {"desc": "Light rain", "icon": "🌧️"},
                63: {"desc": "Moderate rain", "icon": "🌧️"},
                65: {"desc": "Heavy rain", "icon": "🌧️"},
                71: {"desc": "Light snow", "icon": "🌨️"},
                95: {"desc": "Thunderstorm", "icon": "⛈️"}
            }
            
            code = current.get("weather_code", 0)
            weather_info = weather_codes.get(code, {"desc": "Clear", "icon": "☀️"})
            
            # Format forecast
            forecast = []
            for i in range(3):
                day_code = daily["weather_code"][i]
                day_weather = weather_codes.get(day_code, {"desc": "Clear", "icon": "☀️"})
                forecast.append({
                    "temp_max": round(daily["temperature_2m_max"][i]),
                    "temp_min": round(daily["temperature_2m_min"][i]),
                    "icon": day_weather["icon"],
                    "desc": day_weather["desc"]
                })
            
            return {
                "found": True,
                "location": f"{city_name}, {country}",
                "current": {
                    "temp": round(current["temperature_2m"]),
                    "feels_like": round(current["apparent_temperature"]),
                    "humidity": current["relative_humidity_2m"],
                    "wind_speed": round(current["wind_speed_10m"]),
                    "condition": weather_info["desc"],
                    "icon": weather_info["icon"]
                },
                "forecast": forecast
            }
    except Exception as e:
        print(f"Weather API error: {e}")
        return {"found": False, "error": str(e)}

@app.get("/api/dictionary")
async def get_dictionary(word: str):
    """Get dictionary definition using Free Dictionary API."""
    try:
        import httpx
        
        url = f"https://api.dictionaryapi.dev/api/v2/entries/en/{word}"
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            
            if response.status_code != 200:
                return {"found": False, "error": "Word not found"}
            
            data = response.json()
            if not data:
                return {"found": False, "error": "No definitions available"}
            
            entry = data[0]
            word_text = entry.get("word", word)
            phonetic = entry.get("phonetic", "")
            
            # Extract meanings
            meanings = []
            synonyms_set = set()
            
            for meaning in entry.get("meanings", []):
                part_of_speech = meaning.get("partOfSpeech", "")
                for definition in meaning.get("definitions", [])[:3]:  # Limit to 3 definitions per part of speech
                    meanings.append({
                        "partOfSpeech": part_of_speech,
                        "definition": definition.get("definition", ""),
                        "example": definition.get("example", "")
                    })
                    # Collect synonyms
                    for syn in definition.get("synonyms", []):
                        synonyms_set.add(syn)
            
            return {
                "found": True,
                "word": word_text,
                "phonetic": phonetic,
                "meanings": meanings[:5],  # Limit total meanings
                "synonyms": list(synonyms_set)[:8]  # Limit synonyms
            }
    except Exception as e:
        print(f"Dictionary API error: {e}")
        return {"found": False, "error": str(e)}

@app.get("/api/crypto")
async def get_crypto(symbol: str):
    """Get cryptocurrency price using CoinGecko API."""
    try:
        import httpx
        
        # Map common symbols to CoinGecko IDs
        symbol_map = {
            'btc': 'bitcoin', 'bitcoin': 'bitcoin',
            'eth': 'ethereum', 'ethereum': 'ethereum',
            'bnb': 'binancecoin', 'binancecoin': 'binancecoin',
            'xrp': 'ripple', 'ripple': 'ripple',
            'ada': 'cardano', 'cardano': 'cardano',
            'sol': 'solana', 'solana': 'solana',
            'doge': 'dogecoin', 'dogecoin': 'dogecoin',
            'matic': 'matic-network', 'polygon': 'matic-network',
            'dot': 'polkadot', 'polkadot': 'polkadot',
            'ltc': 'litecoin', 'litecoin': 'litecoin'
        }
        
        coin_id = symbol_map.get(symbol.lower())
        if not coin_id:
            return {"found": False, "error": f"Cryptocurrency '{symbol}' not found"}
        
        # CoinGecko Public API
        url = f"https://api.coingecko.com/api/v3/simple/price?ids={coin_id}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            data = response.json()
            
            if coin_id not in data:
                return {"found": False, "error": "Data not available"}
            
            crypto_data = data[coin_id]
            
            return {
                "found": True,
                "name": coin_id.replace('-', ' ').title(),
                "symbol": symbol.upper(),
                "price": crypto_data.get("usd", 0),
                "change_24h": crypto_data.get("usd_24h_change", 0),
                "market_cap": crypto_data.get("usd_market_cap", 0)
            }
    except Exception as e:
        print(f"Crypto API error: {e}")
        return {"found": False, "error": str(e)}

@app.get("/api/stock")
async def get_stock(symbol: str):
    """Get stock price using Yahoo Finance API."""
    try:
        import httpx
        
        # Yahoo Finance API (via query1.finance.yahoo.com)
        # This is a public endpoint used by Yahoo Finance website
        symbol_upper = symbol.upper()
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol_upper}?interval=1d&range=1d"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
            data = response.json()
            
            if "chart" not in data or not data["chart"]["result"]:
                return {"found": False, "error": f"Stock symbol '{symbol}' not found"}
            
            result = data["chart"]["result"][0]
            meta = result["meta"]
            
            current_price = meta.get("regularMarketPrice", 0)
            previous_close = meta.get("previousClose", 0)
            change = current_price - previous_close
            change_percent = (change / previous_close * 100) if previous_close > 0 else 0
            
            return {
                "found": True,
                "symbol": symbol_upper,
                "name": meta.get("longName") or meta.get("shortName") or symbol_upper,
                "price": round(current_price, 2),
                "change": round(change, 2),
                "change_percent": round(change_percent, 2),
                "currency": meta.get("currency", "USD"),
                "market_state": meta.get("marketState", "REGULAR")
            }
    except Exception as e:
        print(f"Stock API error: {e}")
        return {"found": False, "error": str(e)}

@app.get("/api/translate")
async def translate_text(text: str, source: str = "auto", target: str = "en"):
    """Translate text using MyMemory Translation API."""
    try:
        import httpx
        from urllib.parse import quote
        
        # MyMemory Translation API (free, no auth required)
        # Language codes: en, id, es, fr, de, ja, zh, ar, ru, pt, it, ko, etc.
        encoded_text = quote(text)
        langpair = f"{source}|{target}"
        url = f"https://api.mymemory.translated.net/get?q={encoded_text}&langpair={langpair}"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            data = response.json()
            
            if data.get("responseStatus") != 200:
                return {"found": False, "error": "Translation failed"}
            
            translated_text = data.get("responseData", {}).get("translatedText", "")
            
            # Language name mapping
            lang_names = {
                'en': 'English', 'id': 'Indonesian', 'es': 'Spanish', 'fr': 'French',
                'de': 'German', 'ja': 'Japanese', 'zh': 'Chinese', 'ar': 'Arabic',
                'ru': 'Russian', 'pt': 'Portuguese', 'it': 'Italian', 'ko': 'Korean',
                'auto': 'Auto-detect'
            }
            
            return {
                "found": True,
                "original_text": text,
                "translated_text": translated_text,
                "source_language": lang_names.get(source, source.upper()),
                "target_language": lang_names.get(target, target.upper())
            }
    except Exception as e:
        print(f"Translation API error: {e}")
        return {"found": False, "error": str(e)}

class ClickRequest(BaseModel):
    query: str
    url: str
    position: int

@app.post("/api/click")
def track_click(click: ClickRequest):
    """Record user click for search analytics."""
    try:
        from click_tracker import tracker
        tracker.track_click(click.query, click.url, click.position)
        return {"status": "ok"}
    except Exception as e:
        print(f"Click tracking failed: {e}")
        return {"status": "error"}

@app.get("/api/suggestions")
def get_suggestions(q: str = "", limit: int = 8):
    """Enhanced search suggestions with trending, history, and typo correction."""
    try:
        from click_tracker import tracker
        
        suggestions = []
        
        # 1. If empty query, return trending searches
        if not q or len(q) < 2:
            trending = tracker.get_trending_queries(limit)
            return {
                "suggestions": [t["query"] for t in trending],
                "trending": trending,
                "type": "trending"
            }
        
        # 2. Get history-based suggestions
        history_suggestions = tracker.get_query_suggestions(q, limit)
        
        # 3. Add index-based suggestions (from actual indexed content)
        # These are quick prefix matches from common terms
        common_queries = [
            "python tutorial", "javascript framework", "react hooks", "machine learning",
            "web development", "api tutorial", "database design", "css flexbox",
            "how to code", "programming tips", "ai tools", "chatgpt prompts",
            "weather today", "news update", "stock market", "crypto prices"
        ]
        
        matching = [cq for cq in common_queries if cq.lower().startswith(q.lower())]
        
        # 4. Simple typo correction using Levenshtein-like logic
        def similar(a, b):
            if len(a) < 3 or len(b) < 3:
                return False
            count = sum(1 for x, y in zip(a.lower(), b.lower()) if x == y)
            return count / max(len(a), len(b)) > 0.7
        
        did_you_mean = None
        if len(history_suggestions) == 0 and len(matching) == 0:
            # Check for typos against common queries
            for cq in common_queries:
                if similar(q, cq.split()[0]):
                    did_you_mean = cq
                    break
        
        # Combine all suggestions
        all_suggestions = []
        seen = set()
        
        # Priority: history > matching > trending
        for item in history_suggestions:
            if item["query"] not in seen:
                all_suggestions.append({"query": item["query"], "type": "history", "icon": "🕐"})
                seen.add(item["query"])
        
        for m in matching:
            if m not in seen:
                all_suggestions.append({"query": m, "type": "suggestion", "icon": "🔍"})
                seen.add(m)
        
        # Add trending if we have space
        if len(all_suggestions) < limit:
            trending = tracker.get_trending_queries(limit - len(all_suggestions))
            for t in trending:
                if t["query"] not in seen:
                    all_suggestions.append({"query": t["query"], "type": "trending", "icon": "🔥"})
                    seen.add(t["query"])
        
        return {
            "suggestions": [s["query"] for s in all_suggestions[:limit]],
            "rich_suggestions": all_suggestions[:limit],
            "did_you_mean": did_you_mean,
            "type": "mixed"
        }
    except Exception as e:
        print(f"Suggestions error: {e}")
        return {"suggestions": [], "error": str(e)}

@app.get("/stats")
def stats():
    return engine.get_stats()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
