"use client";
import { useState, useEffect } from "react";

interface EntityInfo {
    title: string;
    description: string;
    extract: string;
    image?: string;
    pageUrl: string;
}

interface KnowledgeGraphProps {
    query: string;
}

export default function KnowledgeGraph({ query }: KnowledgeGraphProps) {
    const [entity, setEntity] = useState<EntityInfo | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (query && query.length > 2) {
            fetchWikipedia();
        }
    }, [query]);

    const fetchWikipedia = async () => {
        setLoading(true);
        try {
            // Search Wikipedia for the query
            const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=1`;

            const searchRes = await fetch(searchUrl);
            const searchData = await searchRes.json();

            if (!searchData.query?.search?.length) {
                setEntity(null);
                return;
            }

            const pageTitle = searchData.query.search[0].title;

            // Get page summary and image
            const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`;
            const summaryRes = await fetch(summaryUrl);
            const summaryData = await summaryRes.json();

            if (summaryData.type === 'disambiguation') {
                setEntity(null);
                return;
            }

            setEntity({
                title: summaryData.title,
                description: summaryData.description || '',
                extract: summaryData.extract || '',
                image: summaryData.thumbnail?.source,
                pageUrl: summaryData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${pageTitle}`
            });
        } catch (err) {
            console.error("Wikipedia fetch failed", err);
            setEntity(null);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
        );
    }

    if (!entity) return null;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
                {entity.image && (
                    <img
                        src={entity.image}
                        alt={entity.title}
                        className="w-20 h-20 object-cover rounded-lg"
                    />
                )}
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {entity.title}
                    </h2>
                    {entity.description && (
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                            {entity.description}
                        </p>
                    )}
                </div>
            </div>

            {/* Extract */}
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4 line-clamp-4">
                {entity.extract}
            </p>

            {/* Link to Wikipedia */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <a
                    href={entity.pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.09 2C6.53 2 2 6.53 2 12.09c0 4.41 2.87 8.19 6.84 9.49.5.09.66-.22.66-.48 0-.24-.01-.87-.01-1.7C6 19.97 5.4 18.09 5.4 18.09c-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02.8-.22 1.65-.33 2.5-.33.85 0 1.7.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85 0 1.34-.01 2.42-.01 2.75 0 .27.16.58.67.48A10.014 10.014 0 0022 12.09C22 6.53 17.47 2 12.09 2z" />
                    </svg>
                    Read more on Wikipedia →
                </a>
            </div>
        </div>
    );
}
