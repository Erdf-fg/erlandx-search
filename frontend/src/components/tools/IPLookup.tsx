"use client";
import { useState, useEffect } from "react";

interface IPLookupProps {
    ip?: string;
}

export default function IPLookup({ ip }: IPLookupProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchIP();
    }, [ip]);

    const fetchIP = async () => {
        try {
            // If no specific IP, get user's IP
            const url = ip
                ? `https://ipapi.co/${ip}/json/`
                : 'https://ipapi.co/json/';

            const res = await fetch(url);
            const result = await res.json();
            setData(result);
        } catch (err) {
            console.error("IP fetch failed", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm animate-pulse">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
        );
    }

    if (data?.error) {
        return (
            <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <p className="text-gray-500 dark:text-gray-400">Could not fetch IP information</p>
            </div>
        );
    }

    return (
        <div className="mb-8 p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-800 dark:to-purple-900 rounded-2xl border border-purple-200 dark:border-purple-700 shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">IP Information</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 font-mono mt-1">{data?.ip}</p>
                </div>
                <div className="text-5xl">🌐</div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white/50 dark:bg-gray-900/30 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Location</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {data?.city}, {data?.region}
                    </p>
                </div>
                <div className="bg-white/50 dark:bg-gray-900/30 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Country</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {data?.country_name} {data?.country_code_iso3}
                    </p>
                </div>
                <div className="bg-white/50 dark:bg-gray-900/30 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">ISP</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {data?.org || data?.asn}
                    </p>
                </div>
                <div className="bg-white/50 dark:bg-gray-900/30 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Timezone</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{data?.timezone}</p>
                </div>
                <div className="bg-white/50 dark:bg-gray-900/30 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Coordinates</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {data?.latitude?.toFixed(2)}, {data?.longitude?.toFixed(2)}
                    </p>
                </div>
                <div className="bg-white/50 dark:bg-gray-900/30 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Currency</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{data?.currency}</p>
                </div>
            </div>
        </div>
    );
}
