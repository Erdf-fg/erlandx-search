"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import ResultCard from "@/components/ResultCard";
import Pagination from "@/components/Pagination";
import FilterPanel from "@/components/FilterPanel";
import ThemeToggle from "@/components/ThemeToggle";
import KnowledgePanel from "@/components/KnowledgePanel";
import InstantAnswer from "@/components/InstantAnswer";
import SearchTabs from "@/components/SearchTabs";
import SearchFilters from "@/components/SearchFilters";
import RelatedSearches from "@/components/RelatedSearches";
import ImageGallery from "@/components/ImageGallery";
import FeaturedSnippet from "@/components/FeaturedSnippet";
import Calculator from "@/components/tools/Calculator";
import UnitConverter from "@/components/tools/UnitConverter";
import Weather from "@/components/tools/Weather";
import Dictionary from "@/components/tools/Dictionary";
import Timer from "@/components/tools/Timer";
import Stopwatch from "@/components/tools/Stopwatch";
import CryptoTicker from "@/components/tools/CryptoTicker";
import StockTicker from "@/components/tools/StockTicker";
import TimezoneConverter from "@/components/tools/TimezoneConverter";
import Translator from "@/components/tools/Translator";
import IPLookup from "@/components/tools/IPLookup";
import ColorPicker from "@/components/tools/ColorPicker";
import RandomGenerator from "@/components/tools/RandomGenerator";
import VoiceSearch from "@/components/VoiceSearch";
import EasterEgg, { EASTER_EGG_TRIGGERS } from "@/components/EasterEgg";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { API_URL } from "@/lib/api";

interface SearchResult {
    title: string;
    url: string;
    snippet: string;
    score: number;
    image?: string;
    is_featured?: boolean;
}

interface SearchResponse {
    results: SearchResult[];
    count: number;
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
    spell_suggestion?: string;
}

function SearchResults() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const query = searchParams.get("q") || "";

    const [results, setResults] = useState<SearchResult[]>([]);
    const [pagination, setPagination] = useState({ page: 1, total: 0, total_pages: 0 });
    const [loading, setLoading] = useState(false);
    const [spellSuggestion, setSpellSuggestion] = useState<string | null>(null);
    const [filters, setFilters] = useState<{ dateFilter?: string; sourceFilter?: string }>({});
    const [knowledgePanel, setKnowledgePanel] = useState<any>(null);
    const [instantAnswer, setInstantAnswer] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<string>("all");
    const [showVoiceSearch, setShowVoiceSearch] = useState(false);
    const [easterEgg, setEasterEgg] = useState<string | null>(null);

    // Easter Egg Detection
    const checkEasterEgg = (q: string) => {
        const trigger = EASTER_EGG_TRIGGERS[q.toLowerCase().trim()];
        if (trigger) {
            setEasterEgg(trigger);
            // Auto-close after animation (except games)
            if (!['snake', 'dino'].includes(trigger)) {
                setTimeout(() => setEasterEgg(null), 5000);
            }
        }
    };

    // Check for easter egg when query changes
    useEffect(() => {
        if (query) checkEasterEgg(query);
    }, [query]);

    // Instant Tool Detection
    const calcRegex = /^[\d\+\-\*\/\(\)\.\s]+$/;
    const weatherRegex = /^(weather|cuaca)\s+(.+)/i;
    const dictionaryRegex = /^(define|definition|arti|meaning)\s+(.+)/i;
    const timerRegex = /^timer\s+(\d+)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)?/i;
    const stopwatchRegex = /^stopwatch$/i;
    const cryptoRegex = /^(btc|eth|bnb|xrp|ada|sol|doge|matic|polygon|dot|ltc|bitcoin|ethereum)\s*(price|harga)?$/i;

    // Check if query looks like math (digits + operators, length > 2)
    const showCalculator = calcRegex.test(query.trim()) && query.trim().length > 2 && /\d/.test(query);

    // Check if query looks like weather request
    const weatherMatch = query.match(weatherRegex);
    const showWeather = !!weatherMatch;
    const weatherLocation = weatherMatch ? weatherMatch[2] : "";

    // Check if query looks like dictionary request
    const dictionaryMatch = query.match(dictionaryRegex);
    const showDictionary = !!dictionaryMatch;
    const dictionaryWord = dictionaryMatch ? dictionaryMatch[2] : "";

    // Check if query looks like timer request
    const timerMatch = query.match(timerRegex);
    const showTimer = !!timerMatch;
    const timerDuration = timerMatch ? (() => {
        const value = parseInt(timerMatch[1]);
        const unit = timerMatch[2]?.toLowerCase() || 'minutes';
        if (unit.startsWith('sec')) return value;
        if (unit.startsWith('min')) return value * 60;
        if (unit.startsWith('hour') || unit.startsWith('hr')) return value * 3600;
        return value * 60; // default to minutes
    })() : 0;

    // Check if query looks like stopwatch request
    const showStopwatch = stopwatchRegex.test(query.trim());

    // Check if query looks like crypto request
    const cryptoMatch = query.match(cryptoRegex);
    const showCrypto = !!cryptoMatch;
    const cryptoSymbol = cryptoMatch ? cryptoMatch[1] : "";

    // Check if query looks like stock request
    const stockRegex = /^(aapl|googl|goog|msft|tsla|amzn|meta|nvda|nflx|dis|baba|jpm|v|ma|wmt|pg|jnj|unh|hd|pypl|crm|adbe|csco|intc|amd|nke|sbux|cost|t|vz|ba|ge|cat|mmm|ups|fedex|f|gm)\s*(stock|saham|price|harga)?$/i;
    const stockMatch = query.match(stockRegex);
    const showStock = !!stockMatch;
    const stockSymbol = stockMatch ? stockMatch[1] : "";

    // Check if query looks like timezone request
    const timezoneRegex = /^(time|jam|waktu)\s+(in|di)?\s*(.+)/i;
    const timezoneMatch = query.match(timezoneRegex);
    const showTimezone = !!timezoneMatch;
    const cityName = timezoneMatch ? timezoneMatch[3] : "";

    // Check if query looks like translation request
    const translationRegex = /^(translate|terjemahkan?|translation)\s+(.+?)\s+(to|ke|into)\s+(english|spanish|french|german|japanese|chinese|indonesian|arabic|russian|portuguese|italian|korean|en|es|fr|de|ja|zh|id|ar|ru|pt|it|ko)/i;
    const translationMatch = query.match(translationRegex);
    const showTranslation = !!translationMatch;
    const textToTranslate = translationMatch ? translationMatch[2] : "";
    const targetLangRaw = translationMatch ? translationMatch[4].toLowerCase() : "en";

    // Map language names to codes
    const langMap: Record<string, string> = {
        'english': 'en', 'spanish': 'es', 'french': 'fr', 'german': 'de',
        'japanese': 'ja', 'chinese': 'zh', 'indonesian': 'id', 'arabic': 'ar',
        'russian': 'ru', 'portuguese': 'pt', 'italian': 'it', 'korean': 'ko'
    };
    const targetLang = langMap[targetLangRaw] || targetLangRaw;

    // Check if query is IP lookup
    const ipRegex = /^(my\s*ip|what\s*is\s*my\s*ip|ip\s*address|ip\s+(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}))$/i;
    const ipMatch = query.match(ipRegex);
    const showIP = !!ipMatch;
    const ipAddress = ipMatch && ipMatch[2] ? ipMatch[2] : undefined;

    // Check if query is color picker
    const colorRegex = /^(color|colour|warna)\s*(#?[0-9a-fA-F]{3,6})$/i;
    const colorMatch = query.match(colorRegex);
    const showColor = !!colorMatch;
    const colorValue = colorMatch ? colorMatch[2] : "";

    // Check if query is random generator
    const randomNumberRegex = /^random\s*(number)?\s*(\d+)?\s*(-|to)?\s*(\d+)?$/i;
    const passwordRegex = /^(generate\s*)?password(\s*(\d+))?$/i;
    const coinRegex = /^(flip\s*)?(coin|koin)$/i;
    const diceRegex = /^(roll\s*)?(dice|dadu)$/i;
    const uuidRegex = /^(generate\s*)?uuid$/i;

    const randomNumberMatch = query.match(randomNumberRegex);
    const passwordMatch = query.match(passwordRegex);
    const coinMatch = query.match(coinRegex);
    const diceMatch = query.match(diceRegex);
    const uuidMatch = query.match(uuidRegex);

    const showRandomNumber = !!randomNumberMatch && query.toLowerCase().startsWith('random');
    const showPassword = !!passwordMatch;
    const showCoin = !!coinMatch;
    const showDice = !!diceMatch;
    const showUUID = !!uuidMatch;

    const randomMin = randomNumberMatch && randomNumberMatch[2] ? parseInt(randomNumberMatch[2]) : 1;
    const randomMax = randomNumberMatch && randomNumberMatch[4] ? parseInt(randomNumberMatch[4]) : 100;
    const passwordLength = passwordMatch && passwordMatch[3] ? parseInt(passwordMatch[3]) : 16;

    const fetchResults = async (page: number = 1) => {
        if (!query) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/search`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query,
                    page,
                    per_page: 10,
                    ...filters,
                    tab: activeTab,
                }),
            });
            const data: SearchResponse = await response.json();
            setResults(data.results || []);
            setPagination({
                page: data.page || 1,
                total: data.total || 0,
                total_pages: data.total_pages || 1,
            });
            setSpellSuggestion(data.spell_suggestion || null);
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setInstantAnswer(null);
        fetchResults(1);
        // Fetch knowledge panel
        if (query) {
            fetch(`${API_URL}/api/knowledge-panel?q=${encodeURIComponent(query)}`)
                .then(res => res.json())
                .then(data => setKnowledgePanel(data))
                .catch(err => console.error("Knowledge panel error:", err));

            // Fetch instant answer
            fetch(`${API_URL}/api/instant-answer?q=${encodeURIComponent(query)}`)
                .then(res => res.json())
                .then(data => {
                    if (data.answer) {
                        setInstantAnswer(data.answer);
                    }
                })
                .catch(err => console.error("Instant answer failed", err));
        }
    }, [query, filters, activeTab]);

    const handleFilterChange = (newFilters: { dateFilter?: string; sourceFilter?: string }) => {
        setFilters(newFilters);
        setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 on filter change
    };

    const handleSpellSuggestion = () => {
        if (spellSuggestion) {
            router.push(`/search?q=${encodeURIComponent(spellSuggestion)}`);
        }
    };

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="backdrop-blur-sm border-b border-gray-800/50 sticky top-0 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
                    <a href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                        Erlandx
                    </a>
                    <div className="flex-1 max-w-2xl flex gap-2">
                        <div className="flex-1">
                            <SearchBar initialQuery={query || ""} />
                        </div>
                        {/* Voice Search Button */}
                        <button
                            onClick={() => setShowVoiceSearch(true)}
                            className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors border border-gray-700"
                            title="Voice Search"
                        >
                            <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93h2c0 3.03 2.47 5.5 5.5 5.5S17 11.03 17 8h2c0 4.08-3.06 7.44-7 7.93V20h4v2H8v-2h4v-4.07z" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <FilterPanel onFilterChange={handleFilterChange} />
                        <ThemeSwitcher />
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            {/* Voice Search Modal */}
            {showVoiceSearch && (
                <VoiceSearch
                    onResult={(transcript) => {
                        router.push(`/search?q=${encodeURIComponent(transcript)}`);
                    }}
                    onClose={() => setShowVoiceSearch(false)}
                />
            )}

            {/* Easter Egg */}
            {easterEgg && (
                <EasterEgg
                    type={easterEgg as any}
                    onClose={() => setEasterEgg(null)}
                />
            )}

            {/* Results */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Stats & Spell Suggestion */}
                <div className="mb-6">
                    <div className="text-sm text-gray-400">
                        Found {pagination.total.toLocaleString()} results
                    </div>
                    {spellSuggestion && (
                        <div className="mt-2 text-sm">
                            <span className="text-gray-400">Did you mean: </span>
                            <button
                                onClick={handleSpellSuggestion}
                                className="text-purple-400 hover:text-purple-300 underline"
                            >
                                {spellSuggestion}
                            </button>
                        </div>
                    )}
                </div>

                {/* 2-Column Layout: Results + Knowledge Panel */}
                <div className="flex gap-8">
                    {/* Main Results Column */}
                    <div className="flex-1 min-w-0">
                        {/* Tabs */}
                        <SearchTabs activeTab={activeTab} onTabChange={setActiveTab} />

                        {/* Instant Tools & Answers */}
                        {showCalculator && <Calculator initialExpression={query} />}
                        {showWeather && <Weather location={weatherLocation} />}
                        {showDictionary && <Dictionary word={dictionaryWord} />}
                        {showTimer && <Timer duration={timerDuration} />}
                        {showStopwatch && <Stopwatch />}
                        {showCrypto && <CryptoTicker symbol={cryptoSymbol} />}
                        {showStock && <StockTicker symbol={stockSymbol} />}
                        {showTimezone && <TimezoneConverter city={cityName} />}
                        {showTranslation && <Translator text={textToTranslate} targetLang={targetLang} />}
                        {showIP && <IPLookup ip={ipAddress} />}
                        {showColor && <ColorPicker color={colorValue} />}
                        {showRandomNumber && <RandomGenerator type="number" min={randomMin} max={randomMax} />}
                        {showPassword && <RandomGenerator type="password" length={passwordLength} />}
                        {showCoin && <RandomGenerator type="coin" />}
                        {showDice && <RandomGenerator type="dice" />}
                        {showUUID && <RandomGenerator type="uuid" />}

                        {activeTab === 'all' && instantAnswer && !showCalculator && !showWeather && !showDictionary && !showTimer && !showStopwatch && !showCrypto && !showStock && !showTimezone && !showTranslation && !showIP && !showColor && !showRandomNumber && !showPassword && !showCoin && !showDice && !showUUID && (
                            <InstantAnswer answer={instantAnswer} />
                        )}

                        {/* Loading State */}
                        {loading ? (
                            <div className="space-y-6 animate-pulse">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="bg-gray-800/50 rounded-lg p-4">
                                        <div className="h-4 bg-gray-700 rounded w-1/3 mb-2"></div>
                                        <div className="h-6 bg-gray-700 rounded w-2/3 mb-2"></div>
                                        <div className="h-4 bg-gray-700 rounded w-full"></div>
                                    </div>
                                ))}
                            </div>
                        ) : activeTab === 'images' ? (
                            // Visual Search Gallery
                            <ImageGallery results={results} />
                        ) : results.length > 0 ? (
                            <>


                                {/* Featured Snippet (Top Result) */}
                                {activeTab === 'all' && results[0]?.is_featured && (
                                    <FeaturedSnippet result={results[0]} />
                                )}

                                <div className="space-y-6">
                                    {/* Render all results (if featured is shown, we still show the link logic below, or we could slice it) */}
                                    {results.map((result, index) => {
                                        // Skip the first result IF it is widely featured, to avoid duplication?
                                        // A/B test says: duplication is sometimes okay, but let's hide it if it's featured to look cleaner.
                                        if (index === 0 && result.is_featured && activeTab === 'all') return null;

                                        return (
                                            <ResultCard
                                                key={index}
                                                {...result}
                                                query={query}
                                                position={index + 1}
                                            />
                                        );
                                    })}
                                </div>

                                {/* Pagination */}
                                <Pagination
                                    currentPage={pagination.page}
                                    totalPages={pagination.total_pages}
                                    onPageChange={(page) => fetchResults(page)}
                                />


                            </>
                        ) : (
                            <div className="text-center py-20">
                                <div className="text-6xl mb-4">🔍</div>
                                <h3 className="text-xl font-semibold mb-2">No results found</h3>
                                <p className="text-gray-400">Try checking your spelling or use different keywords.</p>
                                <p className="text-sm text-gray-500 mt-4">
                                    Tip: Make sure you have crawled some websites first!
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Knowledge Panel Column (Desktop Only - Only on 'All' tab) */}
                    {activeTab === 'all' && knowledgePanel?.found && (
                        <div className="hidden lg:block w-96 flex-shrink-0">
                            <KnowledgePanel data={knowledgePanel} />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default function Page() {
    return (
        <Suspense>
            <SearchResults />
        </Suspense>
    );
}
