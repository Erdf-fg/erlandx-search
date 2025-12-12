"use client";
import { useState, useEffect } from "react";
import { API_URL } from "@/lib/api";

interface DictionaryProps {
    word: string;
}

export default function Dictionary({ word }: DictionaryProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDefinition();
    }, [word]);

    const fetchDefinition = async () => {
        try {
            const res = await fetch(`${API_URL}/api/dictionary?word=${encodeURIComponent(word)}`);
            const result = await res.json();
            setData(result);
        } catch (err) {
            console.error("Dictionary fetch failed", err);
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
                <p className="text-gray-500 dark:text-gray-400">Definition not found for "{word}"</p>
            </div>
        );
    }

    return (
        <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            {/* Header */}
            <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Dictionary</h3>
                <div className="flex items-baseline gap-3 mb-2">
                    <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100">{data.word}</h2>
                    {data.phonetic && (
                        <span className="text-xl text-gray-500 dark:text-gray-400">{data.phonetic}</span>
                    )}
                </div>
            </div>

            {/* Meanings */}
            <div className="space-y-4 mb-6">
                {data.meanings.map((meaning: any, index: number) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4">
                        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase mb-1">
                            {meaning.partOfSpeech}
                        </p>
                        <p className="text-gray-900 dark:text-gray-100 mb-1">{meaning.definition}</p>
                        {meaning.example && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                                "{meaning.example}"
                            </p>
                        )}
                    </div>
                ))}
            </div>

            {/* Synonyms */}
            {data.synonyms && data.synonyms.length > 0 && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Synonyms</h4>
                    <div className="flex flex-wrap gap-2">
                        {data.synonyms.map((syn: string, index: number) => (
                            <span
                                key={index}
                                className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                            >
                                {syn}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
