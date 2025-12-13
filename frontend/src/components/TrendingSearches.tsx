"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

interface TrendingQuery {
    query: string;
    count: number;
}

export default function TrendingSearches() {
    const [trending, setTrending] = useState<TrendingQuery[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}/api/trending`)
            .then((res) => res.json())
            .then((data) => {
                setTrending(data.trending || []);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to fetch trending", err);
                setLoading(false);
            });
    }, []);

    if (loading || trending.length === 0) {
        return null;
    }

    return (
        <div className="mt-12 w-full max-w-2xl">
            <h2 className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Trending searches
            </h2>
            <div className="flex flex-wrap gap-2">
                {trending.slice(0, 8).map((item, idx) => (
                    <a
                        key={idx}
                        href={`/search?q=${encodeURIComponent(item.query)}`}
                        className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 
                     rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                     border border-gray-200 dark:border-gray-700"
                    >
                        {item.query}
                    </a>
                ))}
            </div>
        </div>
    );
}
