"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

interface RelatedSearchesProps {
    query: string;
}

export default function RelatedSearches({ query }: RelatedSearchesProps) {
    const [related, setRelated] = useState<string[]>([]);

    useEffect(() => {
        if (!query) return;

        fetch(`${API_URL}/api/related-searches?q=${encodeURIComponent(query)}`)
            .then((res) => res.json())
            .then((data) => setRelated(data.related || []))
            .catch((err) => console.error("Related searches failed", err));
    }, [query]);

    if (related.length === 0) return null;

    return (
        <div className="mt-8">
            <h2 className="text-lg font-normal text-gray-900 dark:text-gray-100 mb-3">
                Related searches
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {related.map((item, idx) => (
                    <a
                        key={idx}
                        href={`/search?q=${encodeURIComponent(item)}`}
                        className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 
                     transition-colors border border-gray-200 dark:border-gray-700 text-sm"
                    >
                        {item}
                    </a>
                ))}
            </div>
        </div>
    );
}
