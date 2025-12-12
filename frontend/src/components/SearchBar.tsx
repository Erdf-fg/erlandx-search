
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AutocompleteDropdown from "./AutocompleteDropdown";
import useVoiceSearch from "../hooks/useVoiceSearch";
import { API_URL } from "@/lib/api";

interface SearchBarProps {
    initialQuery?: string;
    onSearch?: (query: string) => void;
    className?: string;
}

// Add type definition for Web Speech API
declare global {
    interface Window {
        webkitSpeechRecognition: any;
        SpeechRecognition: any;
    }
}

export default function SearchBar({ initialQuery = "", onSearch, className }: SearchBarProps) {
    const [query, setQuery] = useState(initialQuery);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Voice Search Hook
    const { isListening, transcript, startListening } = useVoiceSearch();

    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Sync voice transcript to query and auto-search
    useEffect(() => {
        if (transcript) {
            setQuery(transcript);
            handleSearch(undefined, transcript);
        }
    }, [transcript]);

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
        setHasSearched(false); // Reset when user starts typing again
    };

    return (
        <div ref={wrapperRef} className={`w-full max-w-2xl relative ${className || ''}`}>
            <form onSubmit={handleSearch} className="w-full relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    {/* Search Icon */}
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => query.length >= 2 && !hasSearched && setShowSuggestions(true)}
                    className="block w-full pl-12 pr-16 py-4 bg-gray-800 border border-gray-700 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Search the web..."
                />
                <button
                    type="submit"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                    <div className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full transition-colors">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </div>
                </button>

                {/* Autocomplete Dropdown */}
                {showSuggestions && (
                    <AutocompleteDropdown
                        suggestions={suggestions}
                        isLoading={isLoadingSuggestions}
                        onSelect={handleSuggestionSelect}
                        query={query}
                    />
                )}
            </form>
        </div>
    );
}
