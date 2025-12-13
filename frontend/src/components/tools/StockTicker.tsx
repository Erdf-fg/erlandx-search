"use client";
import { useState, useEffect } from "react";
import { API_URL } from "@/lib/api";

interface StockTickerProps {
    symbol: string;
}

export default function StockTicker({ symbol }: StockTickerProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStock();
    }, [symbol]);

    const fetchStock = async () => {
        try {
            const res = await fetch(`${API_URL}/api/stock?symbol=${encodeURIComponent(symbol)}`);
            const result = await res.json();
            setData(result);
        } catch (err) {
            console.error("Stock fetch failed", err);
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
                <p className="text-gray-500 dark:text-gray-400">Stock "{symbol}" not found</p>
            </div>
        );
    }

    const isPositiveChange = data.change >= 0;
    const isMarketOpen = data.market_state === "REGULAR";

    return (
        <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-blue-900 rounded-2xl border border-blue-200 dark:border-blue-700 shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Stock Price</h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{data.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">{data.symbol}</p>
                        <span className={`text-xs px-2 py-0.5 rounded ${isMarketOpen ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                            {isMarketOpen ? '● Live' : '○ Closed'}
                        </span>
                    </div>
                </div>
                <div className="text-5xl">📈</div>
            </div>

            {/* Price */}
            <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-bold text-gray-900 dark:text-gray-100">
                        {data.currency === 'USD' ? '$' : ''}{data.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-xl text-gray-600 dark:text-gray-300">{data.currency}</span>
                </div>

                {/* Change */}
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${isPositiveChange ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                    <span className={`text-lg font-semibold ${isPositiveChange ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                        {isPositiveChange ? '↗' : '↘'} {data.currency === 'USD' ? '$' : ''}{Math.abs(data.change).toFixed(2)} ({Math.abs(data.change_percent).toFixed(2)}%)
                    </span>
                </div>
            </div>

            {/* Market Info */}
            <div className="pt-4 border-t border-blue-200 dark:border-blue-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    {isMarketOpen ? 'Market is currently open' : 'Market closed - showing last price'}
                </p>
            </div>
        </div>
    );
}
