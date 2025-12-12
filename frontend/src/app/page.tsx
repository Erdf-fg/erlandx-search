"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import useVoiceSearch from "../hooks/useVoiceSearch";

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { isListening, transcript, startListening } = useVoiceSearch();

  // Sync voice transcript to query
  useEffect(() => {
    if (transcript) {
      setQuery(transcript);
      // Optional: Auto-search after a short delay or immediately?
      // Let's just fill it for now so user can confirm.
    }
  }, [transcript]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      {/* Main Content - Centered */}
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-6xl font-semibold text-gray-800 dark:text-gray-100 tracking-tight">
            <span className="text-blue-500">E</span>
            <span className="text-red-500">r</span>
            <span className="text-yellow-500">l</span>
            <span className="text-blue-500">a</span>
            <span className="text-green-500">n</span>
            <span className="text-red-500">d</span>
            <span className="text-red-500">x</span>
          </h1>
        </div>

        {/* Search Box */}
        <form onSubmit={handleSearch} className="w-full max-w-2xl">
          <div className="relative group">
            {/* Search Icon */}
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Input */}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-4 text-base border border-gray-300 dark:border-gray-700 rounded-full
                         hover:shadow-md focus:shadow-md outline-none transition-shadow
                         bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              placeholder={isListening ? "Listening..." : "Search"}
              autoFocus
            />

            {/* Voice Search Icon */}
            <div className="absolute inset-y-0 right-4 flex items-center">
              <button
                type="button"
                onClick={startListening}
                className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-blue-500'}`}
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-center gap-3 mt-8">
            <button
              type="submit"
              className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 
                       rounded hover:shadow hover:border hover:border-gray-300 dark:hover:border-gray-600 transition-all"
            >
              Erlandx Search
            </button>
            <button
              type="button"
              onClick={() => {
                // I'm Feeling Lucky - go to first result
                if (query.trim()) {
                  router.push(`/search?q=${encodeURIComponent(query)}&lucky=1`);
                }
              }}
              className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 
                       rounded hover:shadow hover:border hover:border-gray-300 dark:hover:border-gray-600 transition-all"
            >
              I'm Feeling Lucky
            </button>
          </div>
        </form>

        {/* Language Selector */}
        <div className="mt-8 text-sm text-gray-600 dark:text-gray-400">
          Erlandx offered in:
          <a href="#" className="ml-2 text-blue-600 dark:text-blue-400 hover:underline">Bahasa Indonesia</a>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="px-8 py-3 text-sm text-gray-600 dark:text-gray-400">
          Indonesia
        </div>
        <div className="border-t border-gray-200 dark:border-gray-800 px-8 py-3 flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex gap-6">
            <a href="/about" className="text-sm text-gray-600 dark:text-gray-400 hover:underline">About</a>
            <a href="/how-search-works" className="text-sm text-gray-600 dark:text-gray-400 hover:underline">How Search Works</a>
          </div>
          <div className="flex gap-6">
            <a href="/privacy" className="text-sm text-gray-600 dark:text-gray-400 hover:underline">Privacy</a>
            <a href="/terms" className="text-sm text-gray-600 dark:text-gray-400 hover:underline">Terms</a>
            <a href="/settings" className="text-sm text-gray-600 dark:text-gray-400 hover:underline">Settings</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
