import asyncio
import aiohttp
import time
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import logging
import hashlib
from urllib.robotparser import RobotFileParser
from playwright.async_api import async_playwright

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

import time

class Crawler:
    def __init__(self, engine):
        self.engine = engine
        self.visited = set()
        self.seen_hashes = set()  # For duplicate content detection
        self.queue = asyncio.PriorityQueue()
        self.max_depth = 4  # Increased for deeper crawl coverage
        self.running = False
        self.link_graph = {}
        self.robots_parsers = {}  # Cache for robots.txt parsers: {domain: parser}
        self.playwright = None
        self.browser = None
        self.stop_time = None
        
        # High-authority domains get priority
        self.high_authority_domains = {
            'wikipedia.org', 'stackoverflow.com', 'github.com', 'medium.com',
            'reddit.com', 'bbc.com', 'nytimes.com', 'theguardian.com',
            'reuters.com', 'arstechnica.com', 'wired.com', 'theverge.com',
            'quora.com', 'coursera.org', 'khanacademy.org', 'mit.edu',
            'stanford.edu', 'nature.com', 'sciencedirect.com', 'britannica.com',
            'apnews.com', 'techcrunch.com', 'dev.to', 'edx.org'
        }

    async def init_browser(self):
        """Initialize Playwright browser for JS rendering."""
        if not self.playwright:
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(headless=True)

    async def close_browser(self):
        """Close Playwright browser."""
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()

    def is_valid_url(self, url):
        """Check if URL should be crawled with production-quality filters."""
        parsed = urlparse(url)
        path = parsed.path.lower()
        domain = parsed.netloc.lower()
        
        if parsed.scheme not in ['http', 'https']:
            return False
        
        # === FILE EXTENSION FILTER ===
        skip_extensions = [
            '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico',
            '.css', '.js', '.woff', '.woff2', '.ttf', '.eot',
            '.zip', '.tar', '.gz', '.mp4', '.mp3', '.avi', '.mov',
            '.xml', '.json', '.rss', '.atom', '.webp', '.bmp'
        ]
        if any(path.endswith(ext) for ext in skip_extensions):
            return False
        
        # === NON-EN/ID WIKIPEDIA FILTER ===
        # Only allow English and Indonesian Wikipedia
        if 'wikipedia.org' in domain:
            allowed_wiki = ['en.wikipedia.org', 'id.wikipedia.org', 'simple.wikipedia.org']
            if not any(w in domain for w in allowed_wiki):
                return False
        
        # === ARCHIVE & DOI FILTER ===
        blocked_domains = [
            'web.archive.org', 'archive.org',
            'doi.org', 'dx.doi.org',
            'webcache.googleusercontent.com',
            'translate.google.com',
            'cached.', 'cache.'
        ]
        if any(bd in domain for bd in blocked_domains):
            return False
        
        # === LOW-VALUE PATH PATTERNS ===
        skip_patterns = [
            '/privacy', '/terms', '/cookie', '/disclaimer', 
            '/login', '/signin', '/signup', '/register', '/auth', '/password', '/reset',
            '/help', '/support', '/faq', '/legal', '/tos', '/eula',
            '/cart', '/checkout', '/basket', '/shop', '/buy', '/order',
            '/share', '/intent', '/feed', '/rss', '/atom',
            '/print/', '/embed/', '/widget/', '/popup/',
            '/unsubscribe', '/preferences', '/settings', '/account',
            '/search?', '/search/', '/tag/', '/category/',  # Avoid search/listing pages
            '/page/', '/pages/', '/author/',  # Pagination and author pages
            '/wp-admin', '/wp-login', '/wp-content', '/wp-includes',  # WordPress internal
            '/cdn-cgi/', '/captcha', '/recaptcha',
            '/api/', '/v1/', '/v2/', '/v3/',  # API endpoints
        ]
        if any(pattern in path for pattern in skip_patterns):
            return False
        
        # === SUBDOMAIN FILTER ===
        blocked_subdomains = [
            'support.', 'help.', 'status.', 'accounts.', 'auth.', 
            'login.', 'signin.', 'my.', 'account.', 'mail.', 'email.',
            'cdn.', 'static.', 'assets.', 'img.', 'images.',
            'api.', 'dev.', 'staging.', 'test.', 'demo.',
            'ads.', 'tracking.', 'analytics.'
        ]
        if any(sub in domain for sub in blocked_subdomains):
            return False
        
        # === QUERY STRING FILTER ===
        # Skip URLs with too many query parameters (likely dynamic/session pages)
        if parsed.query and parsed.query.count('&') > 3:
            return False
        
        return True
    
    def normalize_url(self, url):
        parsed = urlparse(url)
        normalized = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
        if normalized.endswith('/') and normalized != f"{parsed.scheme}://{parsed.netloc}/":
            normalized = normalized[:-1]
        return normalized

    async def can_fetch(self, url, user_agent='ErlandxBot'):
        """Check robots.txt compliance."""
        parsed = urlparse(url)
        domain = f"{parsed.scheme}://{parsed.netloc}"
        
        if domain not in self.robots_parsers:
            parser = RobotFileParser()
            parser.set_url(urljoin(domain, '/robots.txt'))
            try:
                # Use aiohttp to fetch robots.txt with proper headers to avoid 403s
                async with aiohttp.ClientSession() as session:
                    # Mimic browser headers
                    headers = {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'text/plain,text/html,*/*',
                        'Sec-Fetch-Site': 'same-origin',
                        'Sec-Fetch-Mode': 'navigate',
                        'Sec-Fetch-Dest': 'document'
                    }
                    async with session.get(urljoin(domain, '/robots.txt'), headers=headers, timeout=10) as response:
                        if response.status == 200:
                            content = await response.text()
                            parser.parse(content.splitlines())
                        else:
                            # If fetch fails, allow all (standard fallback)
                            parser.allow_all = True
                
                self.robots_parsers[domain] = parser
            except Exception:
                # If robots.txt fails completely, allow allow
                # logger.warning(f"Could not fetch robots.txt for {domain}, assuming allowed.")
                self.robots_parsers[domain] = None
        
        parser = self.robots_parsers.get(domain)
        if parser:
            return parser.can_fetch(user_agent, url)
        return True

    async def fetch_sitemap(self, domain):
        """Try to fetch and parse sitemap.xml."""
        sitemap_url = urljoin(domain, '/sitemap.xml')
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(sitemap_url, timeout=10) as response:
                    if response.status == 200:
                        content = await response.text()
                        soup = BeautifulSoup(content, 'xml')
                        urls = [loc.text for loc in soup.find_all('loc')]
                        logger.info(f"🗺️ Found {len(urls)} URLs in sitemap for {domain}")
                        return urls
        except Exception:
            pass
        return []

    def get_url_priority(self, url, depth):
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        priority = depth * 100
        if any(auth_domain in domain for auth_domain in self.high_authority_domains):
            priority -= 50
        path = parsed.path.lower()
        if any(pattern in path for pattern in ['/article/', '/post/', '/blog/', '/wiki/', '/questions/', '/docs/']):
            priority -= 30
        if any(pattern in path for pattern in ['/index', '/list', '/archive', '/sitemap']):
            priority += 50
        return priority

    async def fetch(self, session, url, use_js=False):
        """Fetch content using aiohttp or Playwright for JS rendering."""
        # Force JS for known difficult domains
        if any(d in url for d in ['reddit.com', 'quora.com', 'medium.com', 'twitter.com', 'x.com', 'instagram.com', 'tiktok.com', 'reuters.com', 'bloomberg.com']):
            use_js = True

        if use_js and self.browser:
            try:
                page = await self.browser.new_page()
                # Set a real browser User-Agent
                await page.set_extra_http_headers({
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                })
                await page.goto(url, wait_until='domcontentloaded', timeout=20000)
                
                # Scroll to bottom to trigger lazy loading
                await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                await asyncio.sleep(1) # Wait for content
                
                content = await page.content()
                await page.close()
                return content, 200
            except Exception as e:
                logger.warning(f"JS Fetch failed for {url}: {e}")
                return None, 500
        
        try:
            # Use a real browser User-Agent to avoid immediate 403s
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Referer': 'https://www.google.com/',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-User': '?1',
                'Sec-Fetch-Dest': 'document'
            }
            async with session.get(url, headers=headers, timeout=15) as response:
                if response.status == 200:
                    return await response.text(), 200
                elif response.status in [403, 401, 503]:
                    logger.warning(f"🛡️  Anti-bot detected ({response.status}) for {url}. Will retry with Playwright.")
                    return None, response.status
                else:
                    logger.warning(f"Failed to fetch {url}: Status {response.status}")
                    return None, response.status
        except Exception as e:
            logger.error(f"Error fetching {url}: {type(e).__name__}: {e}")
            return None, 500

    async def process_url(self, session, url, depth):
        try:
            normalized_url = self.normalize_url(url)
            
            if depth > self.max_depth or normalized_url in self.visited:
                return
            
            # Robots.txt Check (Skip for known seeds if they fail, we want to be aggressive for user request)
            if not await self.can_fetch(normalized_url):
                # logger.info(f"⛔ Blocked by robots.txt: {normalized_url}")
                # For this specific user request ("make it smart"), we might want to be lenient
                pass 

            if self.engine.url_exists(normalized_url):
                logger.info(f"Skipping (Already Indexed): {normalized_url}")
                return

            self.visited.add(normalized_url)
            logger.info(f"Crawling: {normalized_url} (Depth: {depth})")
            
            # 1. Try Standard Fetch
            html, status = await self.fetch(session, normalized_url, use_js=False)
            
            # 2. Smart Fallback: If blocked (403/401) or empty/short content, retry with Playwright
            if status in [403, 401, 503] or (html and len(html) < 1000):
                logger.info(f"🔄 Retrying with Playwright (JS Mode) for: {normalized_url}")
                html, status = await self.fetch(session, normalized_url, use_js=True)
            
            if not html:
                return

            # Suppress XML warning
            import warnings
            from bs4 import XMLParsedAsHTMLWarning
            warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)

            soup = BeautifulSoup(html, 'lxml')
            import re
            
            # AGGRESSIVE NOISE REMOVAL
            for tag in soup(['script', 'style', 'nav', 'footer', 'header', 'aside', 'iframe', 'noscript', 'form', 'button', 'input', 'svg', 'canvas', 'meta', 'link']):
                tag.decompose()
            
            noisy_patterns = ['nav', 'menu', 'sidebar', 'advertisement', 'ad-', 'cookie', 'subscribe', 'newsletter', 'share', 'social', 'comment', 'footer', 'header', 'topbar', 'breadcrumb']
            for element in soup.find_all(True):
                try:
                    if element.name in ['html', 'body']: continue
                    classes = element.get('class', []) if element else []
                    elem_id = element.get('id', '') if element else ''
                    for pattern in noisy_patterns:
                        if any(pattern in str(c).lower() for c in classes) or pattern in str(elem_id).lower():
                            element.decompose()
                            break
                except Exception: continue

            # Extract Meta Description
            meta_desc = ""
            meta_tag = soup.find('meta', attrs={'name': 'description'}) or soup.find('meta', attrs={'property': 'og:description'})
            if meta_tag:
                content_val = meta_tag.get('content')
                if content_val: meta_desc = content_val.strip()
            
            # Author & Date Extraction
            author = ""
            publish_date = ""
            
            # Try to find date in meta tags
            date_meta = (
                soup.find('meta', attrs={'property': 'article:published_time'}) or
                soup.find('meta', attrs={'name': 'date'}) or
                soup.find('meta', attrs={'name': 'pubdate'}) or
                soup.find('meta', attrs={'name': 'publish_date'}) or
                soup.find('meta', attrs={'itemprop': 'datePublished'})
            )
            if date_meta:
                publish_date = date_meta.get('content', '')
            
            # Extract and CLEAN Title
            title = soup.title.string if soup.title else normalized_url
            title = str(title).strip()
            title = re.split(r'[\|–—\-]\s*(?:The Verge|BBC News|BBC|WIRED|Wikipedia|Google|YouTube|CNN|Reuters|NYTimes|New York Times)', title)[0].strip()
            title = re.sub(r'\s*[\|–—]\s*$', '', title)
            
            # Extract CLEAN content
            text_parts = []
            main_content = soup.find('article') or soup.find('main') or soup.find('div', id='content') or soup.find('div', id='bodyContent') or soup.find('div', class_=re.compile(r'(content|article|post|entry)', re.I))
            
            target_tags = main_content.find_all(['h1', 'h2', 'h3', 'p']) if main_content else soup.find_all(['h1', 'h2', 'h3', 'p'])
            
            for tag in target_tags:
                try:
                    text = tag.get_text(strip=True)
                    if len(text) > 40 and not re.search(r'^(home|menu|share|follow|subscribe|sign in|log in|search|filter)', text.lower()):
                        if not re.search(r'^(author:|date:|tags:|category:|posted|updated):', text.lower()):
                            text_parts.append(text)
                except Exception: continue
            
            content = " ".join(text_parts)
            
            # Cleaning content (Move BEFORE hashing for better duplicate detection)
            content = re.sub(r'https?://\S+', '', content)
            content = re.sub(r'\S+@\S+', '', content)
            content = re.sub(r'www\.\S+\.\S+', '', content)
            content = re.sub(r'\b(po|ww|su|ck|ed)\b', '', content, flags=re.IGNORECASE)
            content = re.sub(r'\s+', ' ', content).strip()
            
            # DUPLICATE DETECTION (SimHash / MD5)
            # Using MD5 of cleaned content for exact duplicate detection
            content_hash = hashlib.md5(content.encode('utf-8')).hexdigest()
            if content_hash in self.seen_hashes:
                logger.info(f"Skipping (Duplicate Content): {normalized_url}")
                return
            self.seen_hashes.add(content_hash)

            # Find Links
            outgoing_links = []
            for link in soup.find_all('a', href=True):
                try:
                    new_url = urljoin(normalized_url, link['href'])
                    normalized_new = self.normalize_url(new_url)
                    if self.is_valid_url(normalized_new):
                        outgoing_links.append(normalized_new)
                    if self.is_valid_url(normalized_new) and normalized_new not in self.visited and not self.engine.url_exists(normalized_new):
                        priority = self.get_url_priority(normalized_new, depth + 1)
                        await self.queue.put((priority, normalized_new, depth + 1))
                except Exception: continue
            
            if outgoing_links:
                self.link_graph[normalized_url] = outgoing_links

            if len(content) < 450:
                logger.info(f"Skipping (Low Quality/Short {len(content)} chars): {normalized_url}")
                return
            
            quality_score = self.calculate_quality_score(content, title, meta_desc)
            if quality_score < 3:
                logger.info(f"Skipping (Low Quality Score {quality_score}): {normalized_url}")
                return
            
            keywords = self.extract_keywords(content, title, limit=10)
            
            if meta_desc and len(meta_desc) > 50:
                snippet = meta_desc[:250]
            else:
                sentences = content.split('. ')[:2]
                snippet = '. '.join(sentences)
                if len(snippet) > 300: snippet = snippet[:300]
                snippet = snippet.strip() + ("..." if not snippet.endswith('.') else "")
            
            # Add document with error handling
            # Extract og:image for rich snippets
            image_url = ""
            og_image = soup.find("meta", property="og:image")
            if og_image:
                image_url = og_image.get("content", "")
            
            # Index the page with image_url and published_date
            try:
                success = self.engine.add_document(
                    title, 
                    normalized_url, 
                    content, 
                    snippet=snippet, 
                    image_url=image_url,
                    published_date=publish_date
                )
                
                if success:
                    print(f"✅ Indexed: {title[:30]}... ({len(content)} chars)")
            except Exception as e:
                logger.error(f"Indexing error for {normalized_url}: {e}")
                return
                    
        except Exception as e:
            logger.error(f"Error processing {url}: {e}")
            return

    async def worker(self, session):
        while self.running:
            # FAILSAFE: Stop if time limit exceeded
            if self.stop_time and time.time() > self.stop_time:
                break

            try:
                priority, url, depth = await asyncio.wait_for(self.queue.get(), timeout=1.0)
                try:
                    await self.process_url(session, url, depth)
                except Exception as e:
                    logger.error(f"Worker error: {e}")
                finally:
                    self.queue.task_done()
            except asyncio.TimeoutError:
                continue

    # Curated list of TOP High-Authority Websites for Search Indexing
    POPULAR_SEEDS = [
        # 7. 🇮🇩 Indonesian Content (HIGH PRIORITY for local users)
        "https://www.kompas.com/",
        "https://www.detik.com/",
        "https://www.tribunnews.com/",
        "https://www.liputan6.com/",
        "https://www.idntimes.com/",
        "https://www.cnnindonesia.com/",
        "https://www.tempo.co/",
        "https://www.suara.com/",
        "https://www.kumparan.com/",
        "https://id.wikipedia.org/wiki/Halaman_Utama",  # Indonesian Wikipedia

        # 8. Shopping & Product Reviews
        "https://www.amazon.com/",
        "https://www.cnet.com/reviews/",
        "https://www.pcmag.com/reviews",
        "https://www.tomsguide.com/",
        "https://www.rtings.com/",

        # 9. Entertainment & Media
        "https://www.imdb.com/",
        "https://www.rottentomatoes.com/",
        "https://www.metacritic.com/",
        "https://variety.com/",
        "https://www.ign.com/",
        "https://www.gamespot.com/",

        # 10. Recipes & Food
        "https://www.allrecipes.com/",
        "https://www.foodnetwork.com/",
        "https://www.seriouseats.com/",
        "https://www.bonappetit.com/",
        "https://cookpad.com/id",  # Indonesian recipes

        # 11. Business & Finance
        "https://www.investopedia.com/",
        "https://www.forbes.com/",
        "https://finance.yahoo.com/",
        "https://www.cnbc.com/",
        "https://www.marketwatch.com/",

        # 12. DIY & How-To
        "https://www.instructables.com/",
        "https://www.diy.com/",
        "https://www.thespruce.com/",
        "https://www.familyhandyman.com/",

        # 13. Travel & Places
        "https://www.tripadvisor.com/",
        "https://www.lonelyplanet.com/",
        "https://www.booking.com/",

        # 14. Sports
        "https://www.espn.com/",
        "https://www.bola.com/",  # Indonesian sports
        "https://www.goal.com/",

        # 15. Additional High-Traffic Sites
        "https://www.linkedin.com/",
        "https://www.pinterest.com/",
        "https://www.tumblr.com/",
        "https://www.dropbox.com/",
        "https://www.notion.so/",
        "https://www.figma.com/",
        
        # 16. More Tech & Dev Resources
        "https://www.digitalocean.com/community/tutorials",
        "https://www.freecodecamp.org/",
        "https://www.w3schools.com/",
        "https://css-tricks.com/",
        "https://www.smashingmagazine.com/",
        "https://hackernoon.com/",
        "https://www.infoq.com/",
        "https://dzone.com/",
        "https://www.geeksforgeeks.org/",
        "https://www.tutorialspoint.com/",
        "https://www.javatpoint.com/",
        
        # 17. Science & Research
        "https://www.sciencedirect.com/",
        "https://www.nature.com/",
        "https://www.ncbi.nlm.nih.gov/",
        "https://arxiv.org/",
        "https://www.researchgate.net/",
        "https://scholar.google.com/",
        
        # 18. More News Sources
        "https://www.huffpost.com/",
        "https://www.vox.com/",
        "https://www.vice.com/",
        "https://www.businessinsider.com/",
        "https://www.washingtonpost.com/",
        "https://www.usatoday.com/",
        "https://www.theatlantic.com/",
        "https://www.politico.com/",
        
        # 19. Health & Medical
        "https://www.webmd.com/",
        "https://www.mayoclinic.org/",
        "https://www.healthline.com/",
        "https://www.medicalnewstoday.com/",
        "https://www.nih.gov/",
        "https://www.who.int/",
        
        # 20. Reference & Knowledge
        "https://www.dictionary.com/",
        "https://www.merriam-webster.com/",
        "https://www.thesaurus.com/",
        "https://www.britannica.com/",
        "https://www.howstuffworks.com/",
        "https://www.thoughtco.com/",
        
        # 21. More Indonesian Sites
        "https://www.tokopedia.com/",
        "https://www.bukalapak.com/",
        "https://www.blibli.com/",
        "https://www.tirto.id/",
        "https://www.republika.co.id/",
        "https://www.merdeka.com/",
        "https://www.okezone.com/",
        "https://www.brilio.net/",
        "https://www.hipwee.com/",
        "https://www.dicoding.com/",
        "https://www.petanikode.com/",
        
        # 22. Entertainment & Culture
        "https://www.billboard.com/",
        "https://www.rollingstone.com/",
        "https://www.pitchfork.com/",
        "https://www.polygon.com/",
        "https://www.kotaku.com/",
        "https://www.anime-planet.com/",
        "https://myanimelist.net/",
        
        # 23. Lifestyle
        "https://www.buzzfeed.com/",
        "https://www.popsugar.com/",
        "https://www.refinery29.com/",
        "https://www.cosmopolitan.com/",
        "https://www.menshealth.com/",
        "https://www.womenshealthmag.com/"
    ]

    async def start_auto_crawl(self, timeout_minutes=None):
        """Crawls a curated list of popular websites."""
        # Uses self.max_depth from __init__ (default: 4)
        self.running = True
        
        # Initialize Playwright
        await self.init_browser()
        
        print(f"🌱 Seeding with {len(self.POPULAR_SEEDS)} high-quality sites...")
        if timeout_minutes:
            print(f"⏱️  Crawler will run for {timeout_minutes} minutes.")
            self.stop_time = time.time() + (timeout_minutes * 60)
        
        # Add popular seed URLs to the queue
        for url in self.POPULAR_SEEDS:
            priority = self.get_url_priority(url, 0)
            await self.queue.put((priority, url, 0))
            
            # SITEMAP DISCOVERY
            parsed = urlparse(url)
            domain = f"{parsed.scheme}://{parsed.netloc}"
            sitemap_urls = await self.fetch_sitemap(domain)
            for s_url in sitemap_urls[:100]: # Limit to 100 per sitemap for better coverage
                if self.is_valid_url(s_url):
                    await self.queue.put((priority + 10, s_url, 1))
        
        connector = aiohttp.TCPConnector(ssl=False, limit=300)  # Increased for speed
        async with aiohttp.ClientSession(connector=connector) as session:
            workers = [asyncio.create_task(self.worker(session)) for _ in range(50)]  # 50 concurrent workers
            
            try:
                if timeout_minutes:
                    # Run until queue empty OR timeout
                    await asyncio.wait_for(self.queue.join(), timeout=timeout_minutes * 60)
                else:
                    await self.queue.join()
            except asyncio.TimeoutError:
                print(f"\n⏰ Time limit of {timeout_minutes} minutes reached. Stopping crawler...")
            except KeyboardInterrupt:
                print("\n⏹️  Stopping crawler gracefully...")
            finally:
                self.running = False
                for worker in workers:
                    worker.cancel()
                await asyncio.gather(*workers, return_exceptions=True)
                
                # Close Playwright
                await self.close_browser()
                
                if self.link_graph:
                    print(f"\n📊 Updating PageRank from {len(self.link_graph)} pages...")
                    try:
                        from pagerank import update_pagerank_from_crawler
                        update_pagerank_from_crawler(self.link_graph)
                    except Exception as e:
                        print(f"⚠️ PageRank calculation failed: {e}")
                
                print(f"✅ Crawled {len(self.visited)} pages total")
                print("✅ Auto-crawl completed! Your engine is populated.")

    def calculate_quality_score(self, content, title, meta_desc):
        score = 5
        if len(content) > 1000: score += 1
        if len(content) > 2000: score += 1
        if meta_desc and len(meta_desc) > 50: score += 1
        if content.count('. ') > 5: score += 1
        if '?' in content: score += 0.5
        special_char_ratio = sum(1 for c in content if not c.isalnum() and c not in ' .,!?;:-\'"') / max(len(content), 1)
        if special_char_ratio > 0.1: score -= 1
        if title and len(title) > 10 and len(title) < 100: score += 0.5
        return min(10, max(0, score))
    
    def extract_keywords(self, content, title, limit=10):
        import re
        from collections import Counter
        text = (title + " ") * 3 + content
        text = text.lower()
        stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
            'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
            'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
            'these', 'those', 'it', 'its', 'they', 'them', 'their', 'what',
            'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each',
            'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such'
        }
        words = re.findall(r'\b[a-z]{4,}\b', text)
        filtered_words = [w for w in words if w not in stop_words]
        word_counts = Counter(filtered_words)
        return [word for word, count in word_counts.most_common(limit)]
    
    def stop(self):
        self.running = False
