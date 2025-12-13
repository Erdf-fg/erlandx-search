"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AutocompleteDropdown from "./AutocompleteDropdown";
import { API_URL } from "@/lib/api";

interface SearchBarProps {
    initialQuery?: string;
    onSearch?: (query: string) => void;
    className?: string;
}

export default function SearchBar({ initialQuery = "", onSearch, className }: SearchBarProps) {
    const [query, setQuery] = useState(initialQuery);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Click outside to close suggestions
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch autocomplete suggestions
    useEffect(() => {
        if (query.length < 2 || hasSearched) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoadingSuggestions(true);
            try {
                const res = await fetch(`${API_URL}/autocomplete?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                setSuggestions(data.suggestions || []);
                setShowSuggestions(!hasSearched);
            } catch (error) {
                console.error("Autocomplete failed:", error);
            } finally {
                setIsLoadingSuggestions(false);
            }
        }, 150);

        return () => clearTimeout(timer);
    }, [query, hasSearched]);

    const handleSearch = (e?: React.FormEvent, searchQuery: string = query) => {
        e?.preventDefault();
        if (searchQuery.trim()) {
            setShowSuggestions(false);
            setHasSearched(true);
            if (onSearch) {
                onSearch(searchQuery);
            } else {
                router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
            }
        }
    };

    const handleSuggestionSelect = (suggestion: string) => {
        setQuery(suggestion);
        setHasSearched(true);
        setShowSuggestions(false);
        router.push(`/search?q=${encodeURIComponent(suggestion)}`);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
        setHasSearched(false);
    };

    return (
        <div ref={wrapperRef} className={`w-full max-w-2xl relative ${className || ''}`}>
            <form onSubmit={handleSearch} className="w-full relative group shadow-sm hover:shadow-md transition-shadow duration-200 rounded-full bg-white dark:bg-[#303134] border border-gray-200 dark:border-gray-600">
                {/* Search Icon */}
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => query.length >= 2 && !hasSearched && setShowSuggestions(true)}
                    className="block w-full pl-12 pr-12 py-3.5 
                             bg-transparent
                             rounded-full 
                             text-gray-900 dark:text-gray-100 
                             placeholder-gray-500 dark:placeholder-gray-400
                             focus:outline-none focus:ring-0 
                             transition-all text-base"
                    placeholder="Search anything..."
                    aria-label="Search"
                />

                {/* Clear & Search Buttons */}
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1">
                    {query && (
                        <button
                            type="button"
                            onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            aria-label="Clear search"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}

                    <button
                        type="submit"
                        className="p-2 rounded-full text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Search"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>
                </div>

                {/* Autocomplete Dropdown */}
                {showSuggestions && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#303134] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
                        <AutocompleteDropdown
                            suggestions={suggestions}
                            isLoading={isLoadingSuggestions}
                            onSelect={handleSuggestionSelect}
                            query={query}
                        />
                    </div>
                )}
            </form>
        </div>
    );
}
