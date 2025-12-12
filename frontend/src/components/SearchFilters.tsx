"use client";

import { useState } from "react";

interface SearchFiltersProps {
    onFilterChange: (filters: any) => void;
    activeFilters?: any;
}

const TIME_OPTIONS = [
    { value: "", label: "Any time", icon: "🕐" },
    { value: "hour", label: "Past hour", icon: "⏰" },
    { value: "24h", label: "Past 24 hours", icon: "📅" },
    { value: "week", label: "Past week", icon: "📆" },
    { value: "month", label: "Past month", icon: "🗓️" },
    { value: "year", label: "Past year", icon: "📊" },
];

const SORT_OPTIONS = [
    { value: "relevance", label: "Relevance", icon: "🎯" },
    { value: "date", label: "Date", icon: "📅" },
    { value: "popularity", label: "Popularity", icon: "🔥" },
];

export default function SearchFilters({ onFilterChange, activeFilters = {} }: SearchFiltersProps) {
    const [showTools, setShowTools] = useState(false);
    const [timeFilter, setTimeFilter] = useState<string>(activeFilters.date_range || "");
    const [sortBy, setSortBy] = useState<string>(activeFilters.sort || "relevance");
    const [exactMatch, setExactMatch] = useState(activeFilters.exact_match || false);
    const [siteFilter, setSiteFilter] = useState<string>(activeFilters.site_filter || "");

    const applyFilters = () => {
        const filters: any = {};

        if (timeFilter) filters.date_range = timeFilter;
        if (exactMatch) filters.exact_match = true;
        if (siteFilter) filters.site_filter = siteFilter;
        if (sortBy !== "relevance") filters.sort = sortBy;

        onFilterChange(filters);
        setShowTools(false);
    };

    const clearFilters = () => {
        setTimeFilter("");
        setSortBy("relevance");
        setExactMatch(false);
        setSiteFilter("");
        onFilterChange({});
        setShowTools(false);
    };

    const quickTimeFilter = (value: string) => {
        setTimeFilter(value);
        onFilterChange({ ...activeFilters, date_range: value || undefined });
    };

    const hasActiveFilters = timeFilter || exactMatch || siteFilter || sortBy !== "relevance";

    return (
        <div className="flex flex-wrap items-center gap-2">
            {/* Quick Time Filter Chips */}
            <div className="flex flex-wrap gap-1.5">
                {TIME_OPTIONS.slice(0, 4).map((option) => (
                    <button
                        key={option.value}
                        onClick={() => quickTimeFilter(option.value)}
                        className={`px-3 py-1.5 text-xs rounded-full border transition-all ${timeFilter === option.value
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-400"
                            }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            {/* Sort Dropdown */}
            <select
                value={sortBy}
                onChange={(e) => {
                    setSortBy(e.target.value);
                    onFilterChange({ ...activeFilters, sort: e.target.value });
                }}
                className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer"
            >
                {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                        Sort: {option.label}
                    </option>
                ))}
            </select>

            {/* Advanced Tools Button */}
            <div className="relative">
                <button
                    onClick={() => setShowTools(!showTools)}
                    className={`px-3 py-1.5 text-xs rounded-full border flex items-center gap-1.5 transition-all ${hasActiveFilters
                            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700"
                            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-400"
                        }`}
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    Tools
                    {hasActiveFilters && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    )}
                </button>

                {/* Advanced Filters Panel */}
                {showTools && (
                    <div className="absolute top-full mt-2 right-0 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 w-80 z-50">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Advanced Search Tools</h3>

                        {/* Time Filter */}
                        <div className="mb-4">
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Time Range</label>
                            <div className="grid grid-cols-3 gap-1.5">
                                {TIME_OPTIONS.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => setTimeFilter(option.value)}
                                        className={`px-2 py-1.5 text-xs rounded-lg border transition-all ${timeFilter === option.value
                                                ? "bg-blue-600 text-white border-blue-600"
                                                : "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-blue-400"
                                            }`}
                                    >
                                        {option.icon} {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Exact Match */}
                        <div className="mb-4">
                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={exactMatch}
                                    onChange={(e) => setExactMatch(e.target.checked)}
                                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600"
                                />
                                Exact match only
                            </label>
                        </div>

                        {/* Site Filter */}
                        <div className="mb-4">
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Site or Domain</label>
                            <input
                                type="text"
                                value={siteFilter}
                                onChange={(e) => setSiteFilter(e.target.value)}
                                placeholder="e.g. wikipedia.org"
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
                               bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={applyFilters}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Apply Filters
                            </button>
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
