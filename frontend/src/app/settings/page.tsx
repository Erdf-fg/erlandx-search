"use client";

import { useState, useEffect } from "react";

export default function Settings() {
    const [safeSearch, setSafeSearch] = useState(true);
    const [region, setRegion] = useState("id");

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Search Settings</h1>

            <div className="space-y-8">

                {/* Safe Search */}
                <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-800">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h2 className="text-lg font-semibold">SafeSearch Filters</h2>
                            <p className="text-sm text-gray-500">Block explicit result.</p>
                        </div>
                        <button
                            onClick={() => setSafeSearch(!safeSearch)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${safeSearch ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${safeSearch ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>

                {/* Region */}
                <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-800">
                    <h2 className="text-lg font-semibold mb-4">Region for Search Results</h2>
                    <select
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                    >
                        <option value="id">Indonesia</option>
                        <option value="us">United States</option>
                        <option value="sg">Singapore</option>
                        <option value="uk">United Kingdom</option>
                    </select>
                </div>

            </div>

            <div className="mt-12 flex gap-4">
                <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={() => alert("Settings Saved!")}>
                    Save
                </button>
                <a href="/" className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:underline flex items-center">
                    Cancel
                </a>
            </div>
        </div>
    );
}
