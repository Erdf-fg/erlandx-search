import React from "react";
import { API_URL } from "@/lib/api";

interface ResultCardProps {
    title: string;
    url: string;
    snippet: string;
    image?: string;
    query?: string;
    position?: number;
    freshness_badge?: string;
    date?: string;
}

export default function ResultCard({ title, url, snippet, image, query, position, freshness_badge, date }: ResultCardProps) {
    // Extract domain for display
    const getDomain = (url: string) => {
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return url;
        }
    };

    const handleTracking = () => {
        if (query && position !== undefined) {
            // Send tracking beacon (non-blocking)
            fetch(`${API_URL}/api/click`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, url, position }),
                keepalive: true // Ensure request completes even if page unloads
            }).catch(err => console.error("Tracking error:", err));
        }
    };

    // Determine badge style based on content
    const getBadgeStyle = (badge: string) => {
        if (badge.includes('Just now') || badge.includes('This week')) {
            return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
        } else if (badge.includes('This month')) {
            return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
        } else if (badge.includes('outdated')) {
            return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
        }
        return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    };

    return (
        <div className="mb-8 group">
            <div className="flex gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 uppercase">
                            {getDomain(url).charAt(0)}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-gray-900 dark:text-gray-200 font-medium">
                                {getDomain(url)}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[300px]">
                                {url}
                            </span>
                        </div>
                        {/* Freshness Badge */}
                        {freshness_badge && (
                            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${getBadgeStyle(freshness_badge)}`}>
                                {freshness_badge}
                            </span>
                        )}
                    </div>

                    <a
                        href={url}
                        onClick={handleTracking}
                        className="block group-hover:underline decoration-blue-600 decoration-2"
                    >
                        <h3 className="text-xl text-blue-600 dark:text-blue-400 font-medium mb-2 leading-snug">
                            {title}
                        </h3>
                    </a>

                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">
                        {snippet}
                    </p>
                </div>

                {/* Thumbnail Image */}
                {image && (
                    <div className="hidden sm:block flex-shrink-0">
                        <img
                            src={image}
                            alt=""
                            className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
