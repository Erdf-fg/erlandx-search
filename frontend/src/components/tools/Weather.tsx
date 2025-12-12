"use client";
import { useState, useEffect } from "react";
import { API_URL } from "@/lib/api";

interface WeatherProps {
    location: string;
}

export default function Weather({ location }: WeatherProps) {
    const [weather, setWeather] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWeather();
    }, [location]);

    const fetchWeather = async () => {
        try {
            const res = await fetch(`${API_URL}/api/weather?location=${encodeURIComponent(location)}`);
            const data = await res.json();
            setWeather(data);
        } catch (err) {
            console.error("Weather fetch failed", err);
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

    if (!weather?.found) {
        return (
            <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <p className="text-gray-500 dark:text-gray-400">Weather data not available for "{location}"</p>
            </div>
        );
    }

    const { current, forecast: forecastData } = weather;

    return (
        <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-blue-900 rounded-2xl border border-blue-200 dark:border-blue-700 shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Weather</h3>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{weather.location}</p>
                </div>
                <div className="text-6xl">{current.icon}</div>
            </div>

            {/* Current Weather */}
            <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-6xl font-bold text-gray-900 dark:text-gray-100">{current.temp}°</span>
                    <span className="text-2xl text-gray-600 dark:text-gray-300">C</span>
                </div>
                <p className="text-lg text-gray-700 dark:text-gray-300 mb-1">{current.condition}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Feels like {current.feels_like}°C</p>
            </div>

            {/* Weather Details Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-white/50 dark:bg-gray-900/30 rounded-xl">
                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Humidity</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{current.humidity}%</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Wind</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{current.wind_speed} km/h</p>
                </div>
            </div>

            {/* 3-Day Forecast */}
            <div>
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">3-Day Forecast</h4>
                <div className="grid grid-cols-3 gap-3">
                    {forecastData.map((day: any, i: number) => (
                        <div key={i} className="p-3 bg-white/70 dark:bg-gray-900/40 rounded-lg text-center">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                {i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : 'Day 3'}
                            </p>
                            <div className="text-3xl mb-1">{day.icon}</div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {day.temp_max}° / {day.temp_min}°
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{day.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
