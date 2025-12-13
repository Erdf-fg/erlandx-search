"use client";
import { useState } from "react";

interface RandomGeneratorProps {
    type: 'number' | 'password' | 'coin' | 'dice' | 'uuid';
    min?: number;
    max?: number;
    length?: number;
}

export default function RandomGenerator({ type, min = 1, max = 100, length = 16 }: RandomGeneratorProps) {
    const [result, setResult] = useState<string>("");
    const [copied, setCopied] = useState(false);
    const [animating, setAnimating] = useState(false);

    const generate = () => {
        setAnimating(true);
        setTimeout(() => setAnimating(false), 300);

        switch (type) {
            case 'number':
                setResult(String(Math.floor(Math.random() * (max - min + 1)) + min));
                break;
            case 'password':
                const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
                let pw = "";
                for (let i = 0; i < length; i++) {
                    pw += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                setResult(pw);
                break;
            case 'coin':
                setResult(Math.random() < 0.5 ? "Heads 🪙" : "Tails 🪙");
                break;
            case 'dice':
                setResult(String(Math.floor(Math.random() * 6) + 1) + " 🎲");
                break;
            case 'uuid':
                setResult(crypto.randomUUID());
                break;
        }
    };

    const copyResult = () => {
        navigator.clipboard.writeText(result.replace(/[^a-zA-Z0-9\-]/g, '').trim());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Generate on mount
    if (!result) {
        setTimeout(generate, 100);
    }

    const getTitle = () => {
        switch (type) {
            case 'number': return `Random Number (${min}-${max})`;
            case 'password': return `Password Generator`;
            case 'coin': return `Coin Flip`;
            case 'dice': return `Dice Roll`;
            case 'uuid': return `UUID Generator`;
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'number': return '🔢';
            case 'password': return '🔐';
            case 'coin': return '🪙';
            case 'dice': return '🎲';
            case 'uuid': return '🆔';
        }
    };

    return (
        <div className="mb-8 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-emerald-900 rounded-2xl border border-emerald-200 dark:border-emerald-700 shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Random Generator</h3>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">{getTitle()}</p>
                </div>
                <div className="text-5xl">{getIcon()}</div>
            </div>

            {/* Result */}
            <div
                className={`bg-white dark:bg-gray-900 p-6 rounded-xl text-center mb-6 transition-transform ${animating ? 'scale-95' : 'scale-100'
                    }`}
            >
                <p className={`font-mono font-bold text-gray-900 dark:text-gray-100 ${type === 'uuid' || type === 'password' ? 'text-lg break-all' : 'text-5xl'
                    }`}>
                    {result || "..."}
                </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <button
                    onClick={generate}
                    className="flex-1 px-4 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Generate Again
                </button>
                {(type === 'password' || type === 'uuid') && (
                    <button
                        onClick={copyResult}
                        className={`px-4 py-3 rounded-xl font-medium transition-colors ${copied
                                ? "bg-green-500 text-white"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                            }`}
                    >
                        {copied ? "Copied!" : "Copy"}
                    </button>
                )}
            </div>
        </div>
    );
}
