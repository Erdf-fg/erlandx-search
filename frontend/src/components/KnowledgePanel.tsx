"use client";

import { useState } from "react";

interface KnowledgePanelProps {
    data: {
        found: boolean;
        title?: string;
        type?: string; // This property is not used in the new design, but kept for interface consistency if needed elsewhere.
        summary?: string;
        image?: string;
        facts?: Array<{
            label: string;
            value: string;
        }>;
        quickLinks?: Array<{
            name: string;
            url: string;
            icon: string;
        }>;
        source?: string;
        sourceUrl?: string;
        relatedTopics?: Array<{
            title: string;
            url: string;
            image?: string;
        }>;
    };
}

export default function KnowledgePanel({ data }: KnowledgePanelProps) {
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

    if (!data.found) return null;

    const description = data.summary || "";
    const shouldTruncate = description.length > 200;
    const displayDescription = shouldTruncate && !isDescriptionExpanded
        ? description.substring(0, 200) + "..."
        : description;

    return (
        <div className="w-80">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden mb-6 transition-colors duration-300">
                {/* Header with Gradient Border */}
                <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

                <div className="p-6">
                    {/* Title & Type */}
                    <div className="mb-4">
                        <h2 className="text-2xl font-medium text-gray-900 dark:text-gray-100 mb-1">
                            {data.title}
                        </h2>
                        <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                            {data.type}
                        </div>
                    </div>
                    {/* Image */}
                    {data.image && (
                        <div className="w-full mb-4">
                            <img
                                src={data.image}
                                alt={data.title}
                                className="w-full h-48 object-contain bg-gray-50 dark:bg-gray-800/50 rounded-md"
                            />
                        </div>
                    )}

                    {/* Description - Expandable */}
                    {description && (
                        <div className="mb-4">
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                {displayDescription}
                            </p>
                            {shouldTruncate && (
                                <button
                                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                    className="mt-2 flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    <span>{isDescriptionExpanded ? "Show less" : "More"}</span>
                                    <svg
                                        className={`w-4 h-4 transition-transform ${isDescriptionExpanded ? "rotate-180" : ""} `}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    )}

                    {/* Facts List (Google-style) */}
                    {data.facts && data.facts.length > 0 && (
                        <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mb-6">
                            {data.facts.map((fact, index) => (
                                <div key={index} className="flex flex-col sm:flex-row gap-1 sm:gap-4 py-2 border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 sm:w-1/3 shrink-0">
                                        {fact.label}
                                    </span>
                                    <span className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
                                        {fact.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Quick Links (Wikipedia, Website, etc) */}
                    {/* Quick Links (Wikipedia, Website, etc) */}
                    {data.quickLinks && data.quickLinks.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                            {data.quickLinks.map((link, index) => (
                                <a
                                    key={index}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-sm font-medium text-blue-600 dark:text-blue-400 transition-colors"
                                >
                                    {link.icon === 'wikipedia' && <span>W</span>}
                                    {link.icon === 'globe' && <span>🌐</span>}
                                    {link.name}
                                </a>
                            ))}
                        </div>
                    )}

                    {/* Source */}
                    {data.source && (
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Source: <a href={data.sourceUrl} className="hover:underline">{data.source}</a>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
