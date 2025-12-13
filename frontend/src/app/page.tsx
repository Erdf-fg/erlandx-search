"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#202124] text-gray-900 dark:text-white transition-colors duration-200 font-sans">
      {/* Simple Header with Theme Toggle */}
      <header className="flex justify-end p-4 items-center">
        <ThemeToggle />
      </header>

      {/* Main Content - Centered */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 -mt-16">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-[5.5rem] font-semibold tracking-tighter leading-none select-none">
            <span className="text-[#4285F4]">E</span>
            <span className="text-[#EA4335]">r</span>
            <span className="text-[#FBBC05]">l</span>
            <span className="text-[#4285F4]">a</span>
            <span className="text-[#34A853]">n</span>
            <span className="text-[#EA4335]">d</span>
            <span className="text-[#4285F4]">x</span>
          </h1>
        </div>

        {/* Search Box */}
        <div className="w-full max-w-[584px]">
          <form onSubmit={handleSearch} className="w-full relative group shadow hover:shadow-md transition-shadow duration-200 rounded-full bg-white dark:bg-[#303134] border border-gray-200 dark:border-gray-600">
            <div className="flex items-center px-4 min-h-[46px]">
              {/* Search Icon */}
              <div className="pr-3 text-gray-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-base text-gray-900 dark:text-gray-100 h-10"
                placeholder="Search Erlandx..."
                autoFocus
                aria-label="Search"
              />

              {/* Clear Button */}
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  aria-label="Clear"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-3 mt-8">
          <button
            onClick={handleSearch}
            className="px-6 py-2.5 bg-[#f8f9fa] dark:bg-[#303134] text-sm text-[#3c4043] dark:text-[#e8eaed] rounded hover:shadow hover:border-gray-200 dark:hover:border-gray-600 border border-transparent transition-all"
          >
            Erlandx Search
          </button>
          <button
            onClick={() => query.trim() && router.push(`/search?q=${encodeURIComponent(query)}&lucky=1`)}
            className="px-6 py-2.5 bg-[#f8f9fa] dark:bg-[#303134] text-sm text-[#3c4043] dark:text-[#e8eaed] rounded hover:shadow hover:border-gray-200 dark:hover:border-gray-600 border border-transparent transition-all"
          >
            I'm Feeling Lucky
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#f2f2f2] dark:bg-[#171717] text-[#70757a] dark:text-[#9aa0a6]">
        <div className="px-8 py-3 flex flex-col md:flex-row justify-between gap-4">
          <div className="flex gap-6 flex-wrap justify-center md:justify-start">
            <a href="/about" className="text-sm hover:underline">About</a>
            <a href="/how-search-works" className="text-sm hover:underline">How Search Works</a>
          </div>
          <div className="flex gap-6 flex-wrap justify-center md:justify-end">
            <a href="/privacy" className="text-sm hover:underline">Privacy</a>
            <a href="/terms" className="text-sm hover:underline">Terms</a>
            <a href="/settings" className="text-sm hover:underline">Settings</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
