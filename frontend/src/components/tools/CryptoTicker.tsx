"use client";
import { useState, useEffect } from "react";
import { API_URL } from "@/lib/api";

interface CryptoTickerProps {
    symbol: string;
}

export default function CryptoTicker({ symbol }: CryptoTickerProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCrypto();
    }, [symbol]);

    const fetchCrypto = async () => {
        try {
            const res = await fetch(`${API_URL}/api/crypto?symbol=${encodeURIComponent(symbol)}`);
            const result = await res.json();
            setData(result);
        } catch (err) {
            console.error("Crypto fetch failed", err);
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

    if (!data?.found) {
        return (
            <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <p className="text-gray-500 dark:text-gray-400">Cryptocurrency "{symbol}" not found</p>
            </div>
        );
    }

    const isPositiveChange = data.change_24h >= 0;

    return (
        <div className="mb-8 p-6 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-gray-800 dark:to-yellow-900 rounded-2xl border border-orange-200 dark:border-orange-700 shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Cryptocurrency</h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{data.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{data.symbol}</p>
                </div>
                <div className="text-5xl">₿</div>
            </div>

            {/* Price */}
            <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-bold text-gray-900 dark:text-gray-100">
                        ${data.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-xl text-gray-600 dark:text-gray-300">USD</span>
                </div>

                {/* 24h Change */}
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${isPositiveChange ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                    <span className={`text-lg font-semibold ${isPositiveChange ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                        {isPositiveChange ? '↗' : '↘'} {Math.abs(data.change_24h).toFixed(2)}%
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">24h</span>
                </div>
            </div>

            {/* Market Cap */}
            <div className="pt-4 border-t border-orange-200 dark:border-orange-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Market Cap</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    ${(data.market_cap / 1_000_000_000).toFixed(2)}B
                </p>
            </div>
        </div>
    );
}
