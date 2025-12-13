// API Configuration for Erlandx Search

// Use environment variable for production, fallback to localhost for development
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
console.log("🚀 Frontend Configured API_URL:", API_URL); // DEBUG: Check what URL is being used

// Helper function to make API calls
export async function apiCall<T>(
    endpoint: string,
    options?: RequestInit
): Promise<T> {
    const url = `${API_URL}${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    if (!response.ok) {
        console.error(`❌ API Error [${url}]: ${response.status} ${response.statusText}`);
        throw new Error(`API error: ${response.status}`);
    }

    return response.json();
}

// Search API
export async function search(query: string, page: number = 1, perPage: number = 10) {
    return apiCall('/search', {
        method: 'POST',
        body: JSON.stringify({ query, page, per_page: perPage }),
    });
}

// Suggestions API
export async function getSuggestions(query: string) {
    return apiCall(`/api/suggestions?q=${encodeURIComponent(query)}`);
}

// Weather API
export async function getWeather(location: string) {
    return apiCall(`/api/weather?location=${encodeURIComponent(location)}`);
}

// Dictionary API
export async function getDictionary(word: string) {
    return apiCall(`/api/dictionary?word=${encodeURIComponent(word)}`);
}

// Crypto API
export async function getCrypto(symbol: string) {
    return apiCall(`/api/crypto?symbol=${encodeURIComponent(symbol)}`);
}

// Stock API
export async function getStock(symbol: string) {
    return apiCall(`/api/stock?symbol=${encodeURIComponent(symbol)}`);
}

// Translation API
export async function translate(text: string, source: string, target: string) {
    return apiCall(`/api/translate?text=${encodeURIComponent(text)}&source=${source}&target=${target}`);
}

// Click tracking API
export async function trackClick(query: string, url: string, position: number) {
    return apiCall('/api/click', {
        method: 'POST',
        body: JSON.stringify({ query, url, position }),
    });
}
