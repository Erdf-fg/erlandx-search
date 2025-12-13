'use client';

import { useState } from 'react';

interface FilterPanelProps {
    onFilterChange: (filters: { dateFilter?: string; sourceFilter?: string }) => void;
}

export default function FilterPanel({ onFilterChange }: FilterPanelProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [dateFilter, setDateFilter] = useState('');
    const [sourceFilter, setSourceFilter] = useState('');

    const handleApply = () => {
        onFilterChange({
            dateFilter: dateFilter || undefined,
            sourceFilter: sourceFilter || undefined,
        });
    };

    const handleClear = () => {
        setDateFilter('');
        setSourceFilter('');
        onFilterChange({});
    };

    return (
        <div className="relative">
            {/* Filter Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                </svg>
                Filters
            </button>

            {/* Filter Panel */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-4 z-50">
                    <h3 className="text-lg font-semibold mb-4">Advanced Filters</h3>

                    {/* Date Filter */}
                    <div className="mb-4">
                        <label className="block text-sm text-gray-400 mb-2">Time Range</label>
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
                        >
                            <option value="">All time</option>
                            <option value="day">Last 24 hours</option>
                            <option value="week">Last week</option>
                            <option value="month">Last month</option>
                            <option value="year">Last year</option>
                        </select>
                    </div>

                    {/* Source Filter */}
                    <div className="mb-4">
                        <label className="block text-sm text-gray-400 mb-2">Source/Domain</label>
                        <input
                            type="text"
                            value={sourceFilter}
                            onChange={(e) => setSourceFilter(e.target.value)}
                            placeholder="e.g., bbc.com, wikipedia.org"
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">Filter by domain name</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleApply}
                            className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                        >
                            Apply
                        </button>
                        <button
                            onClick={handleClear}
                            className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
