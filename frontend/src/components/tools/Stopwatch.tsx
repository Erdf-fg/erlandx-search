"use client";
import { useState, useEffect, useRef } from "react";

export default function Stopwatch() {
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setTime(prev => prev + 1);
            }, 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning]);

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleReset = () => {
        setTime(0);
        setIsRunning(false);
    };

    const handleToggle = () => {
        setIsRunning(!isRunning);
    };

    return (
        <div className="mb-8 p-6 bg-gradient-to-br from-green-50 to-teal-50 dark:from-gray-800 dark:to-teal-900 rounded-2xl border border-green-200 dark:border-green-700 shadow-lg">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">Stopwatch</h3>

            {/* Stopwatch Display */}
            <div className="text-center mb-6">
                <div className={`text-7xl font-bold mb-2 text-gray-900 dark:text-gray-100 ${isRunning ? 'animate-pulse' : ''}`}>
                    {formatTime(time)}
                </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4">
                <button
                    onClick={handleToggle}
                    className={`px-8 py-4 ${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg font-semibold text-lg transition-colors`}
                >
                    {isRunning ? '⏸ Stop' : '▶ Start'}
                </button>
                <button
                    onClick={handleReset}
                    className="px-8 py-4 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold text-lg transition-colors"
                >
                    🔄 Reset
                </button>
            </div>
        </div>
    );
}
