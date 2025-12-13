"use client";
import { useState, useEffect } from "react";
import { API_URL } from "@/lib/api";

interface TranslatorProps {
    text: string;
    sourceLang?: string;
    targetLang?: string;
}

export default function Translator({ text, sourceLang = "auto", targetLang = "en" }: TranslatorProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTranslation();
    }, [text, sourceLang, targetLang]);

    const fetchTranslation = async () => {
        try {
            const res = await fetch(
                `${API_URL}/api/translate?text=${encodeURIComponent(text)}&source=${sourceLang}&target=${targetLang}`
            );
            const result = await res.json();
            setData(result);
        } catch (err) {
            console.error("Translation fetch failed", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm animate-pulse">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
        );
    }

    if (!data?.found) {
        return (
            <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <p className="text-gray-500 dark:text-gray-400">Translation failed</p>
            </div>
        );
    }

    return (
        <div className="mb-8 p-6 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-gray-800 dark:to-cyan-900 rounded-2xl border border-cyan-200 dark:border-cyan-700 shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Translation</h3>
                <div className="text-4xl">🌐</div>
            </div>

            {/* Original Text */}
            <div className="mb-6 p-4 bg-white/50 dark:bg-gray-900/30 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-2">
                    {data.source_language}
                </p>
                <p className="text-lg text-gray-900 dark:text-gray-100">{data.original_text}</p>
            </div>

            {/* Translation Arrow */}
            <div className="text-center mb-6">
                <div className="text-3xl text-cyan-600 dark:text-cyan-400">↓</div>
            </div>

            {/* Translated Text */}
            <div className="p-4 bg-cyan-100 dark:bg-cyan-900/40 rounded-lg">
                <p className="text-xs text-cyan-700 dark:text-cyan-300 uppercase mb-2 font-semibold">
                    {data.target_language}
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {data.translated_text}
                </p>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-cyan-200 dark:border-cyan-700 mt-6">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Powered by MyMemory Translation API
                </p>
            </div>
        </div>
    );
}
