'use client';

import { useEffect, useRef } from 'react';

interface RichSuggestion {
    query: string;
    type: 'history' | 'trending' | 'suggestion';
    icon: string;
}

interface AutocompleteDropdownProps {
    suggestions: string[];
    richSuggestions?: RichSuggestion[];
    didYouMean?: string | null;
    isLoading: boolean;
    onSelect: (suggestion: string) => void;
    query: string;
}

export default function AutocompleteDropdown({
    suggestions,
    richSuggestions,
    didYouMean,
    isLoading,
    onSelect,
    query
}: AutocompleteDropdownProps) {
    const dropdownRef = useRef<HTMLDivElement>(null);

    if (!query || query.length < 2) return null;

    // Helper to highlight match
    const highlightMatch = (text: string, highlight: string) => {
        if (!highlight) return text;
        const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) =>
                    part.toLowerCase() === highlight.toLowerCase() ? (
                        <span key={i} className="font-semibold text-gray-900 dark:text-white">{part}</span>
                    ) : (
                        <span key={i} className="text-gray-600 dark:text-gray-400">{part}</span>
                    )
                )}
            </span>
        );
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'history': return 'Recent';
            case 'trending': return 'Trending';
            default: return '';
        }
    };

    const displaySuggestions = richSuggestions || suggestions.map(s => ({ query: s, type: 'suggestion' as const, icon: '🔍' }));

    return (
        <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-80 overflow-y-auto z-50 divide-y divide-gray-100 dark:divide-gray-800"
        >
            {/* Did You Mean */}
            {didYouMean && (
                <div className="px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-100 dark:border-yellow-800">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Did you mean: </span>
                    <button
                        onClick={() => onSelect(didYouMean)}
                        className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline"
                    >
                        {didYouMean}
                    </button>
                </div>
            )}

            {isLoading ? (
                <div className="px-4 py-3 text-sm text-gray-400">Loading suggestions...</div>
            ) : displaySuggestions.length > 0 ? (
                <ul>
                    {displaySuggestions.map((suggestion, idx) => (
                        <li key={idx}>
                            <button
                                onClick={() => onSelect(suggestion.query)}
                                className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-3 group"
                            >
                                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full group-hover:bg-white dark:group-hover:bg-gray-700 transition-colors text-lg">
                                    {suggestion.icon || '🔍'}
                                </div>
                                <div className="flex-1 flex items-center justify-between">
                                    <span className="text-sm truncate max-w-[300px] md:max-w-[400px]">
                                        {highlightMatch(suggestion.query, query)}
                                    </span>
                                    {suggestion.type !== 'suggestion' && (
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${suggestion.type === 'trending'
                                                ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                                                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                            }`}>
                                            {getTypeLabel(suggestion.type)}
                                        </span>
                                    )}
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            ) : null}
        </div>
    );
}
