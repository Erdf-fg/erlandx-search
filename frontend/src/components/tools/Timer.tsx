"use client";
import { useState, useEffect, useRef } from "react";

interface TimerProps {
    duration: number; // in seconds
}

export default function Timer({ duration }: TimerProps) {
    const [timeLeft, setTimeLeft] = useState(duration);
    const [isRunning, setIsRunning] = useState(true);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Sync with duration prop changes (when user changes query)
    useEffect(() => {
        setTimeLeft(duration);
        setIsRunning(true);
    }, [duration]);

    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        setIsRunning(false);
                        // Play sound or notification
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning, timeLeft]);

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hrs > 0) {
            return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleReset = () => {
        setTimeLeft(duration);
        setIsRunning(false);
    };

    const handleToggle = () => {
        setIsRunning(!isRunning);
    };

    return (
        <div className="mb-8 p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-purple-900 rounded-2xl border border-purple-200 dark:border-purple-700 shadow-lg">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">Timer</h3>

            {/* Timer Display */}
            <div className="text-center mb-6">
                <div className={`text-7xl font-bold mb-2 ${timeLeft === 0 ? 'text-red-500 animate-pulse' : 'text-gray-900 dark:text-gray-100'}`}>
                    {formatTime(timeLeft)}
                </div>
                {timeLeft === 0 && (
                    <p className="text-xl text-red-500 font-semibold">Time's Up! ⏰</p>
                )}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-6">
                <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${((duration - timeLeft) / duration) * 100}%` }}
                />
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4">
                <button
                    onClick={handleToggle}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                >
                    {isRunning ? '⏸ Pause' : timeLeft === 0 ? '🔄 Restart' : '▶ Resume'}
                </button>
                <button
                    onClick={handleReset}
                    className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
                >
                    🔄 Reset
                </button>
            </div>
        </div>
    );
}
