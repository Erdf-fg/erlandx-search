"use client";
import { useState, useEffect } from "react";

interface TimezoneConverterProps {
    city: string;
}

// Map city names to IANA timezone identifiers
const CITY_TIMEZONES: Record<string, { timezone: string; country: string }> = {
    'jakarta': { timezone: 'Asia/Jakarta', country: 'Indonesia' },
    'tokyo': { timezone: 'Asia/Tokyo', country: 'Japan' },
    'singapore': { timezone: 'Asia/Singapore', country: 'Singapore' },
    'london': { timezone: 'Europe/London', country: 'UK' },
    'paris': { timezone: 'Europe/Paris', country: 'France' },
    'berlin': { timezone: 'Europe/Berlin', country: 'Germany' },
    'moscow': { timezone: 'Europe/Moscow', country: 'Russia' },
    'dubai': { timezone: 'Asia/Dubai', country: 'UAE' },
    'mumbai': { timezone: 'Asia/Kolkata', country: 'India' },
    'delhi': { timezone: 'Asia/Kolkata', country: 'India' },
    'bangkok': { timezone: 'Asia/Bangkok', country: 'Thailand' },
    'hongkong': { timezone: 'Asia/Hong_Kong', country: 'Hong Kong' },
    'seoul': { timezone: 'Asia/Seoul', country: 'South Korea' },
    'sydney': { timezone: 'Australia/Sydney', country: 'Australia' },
    'melbourne': { timezone: 'Australia/Melbourne', country: 'Australia' },
    'auckland': { timezone: 'Pacific/Auckland', country: 'New Zealand' },
    'newyork': { timezone: 'America/New_York', country: 'USA' },
    'losangeles': { timezone: 'America/Los_Angeles', country: 'USA' },
    'chicago': { timezone: 'America/Chicago', country: 'USA' },
    'toronto': { timezone: 'America/Toronto', country: 'Canada' },
    'vancouver': { timezone: 'America/Vancouver', country: 'Canada' },
    'saopaulo': { timezone: 'America/Sao_Paulo', country: 'Brazil' },
    'buenosaires': { timezone: 'America/Argentina/Buenos_Aires', country: 'Argentina' }
};

export default function TimezoneConverter({ city }: TimezoneConverterProps) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const cityKey = city.toLowerCase().replace(/\s+/g, '');
    const timezoneInfo = CITY_TIMEZONES[cityKey];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    if (!timezoneInfo) {
        return (
            <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <p className="text-gray-500 dark:text-gray-400">Timezone for "{city}" not found</p>
                <p className="text-xs text-gray-400 mt-2">Try: Jakarta, Tokyo, London, New York, etc.</p>
            </div>
        );
    }

    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezoneInfo.timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    const dateFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezoneInfo.timezone,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const formattedTime = formatter.format(currentTime);
    const formattedDate = dateFormatter.format(currentTime);

    // Get timezone offset
    const offset = new Intl.DateTimeFormat('en-US', {
        timeZone: timezoneInfo.timezone,
        timeZoneName: 'shortOffset'
    }).formatToParts(currentTime).find(part => part.type === 'timeZoneName')?.value || '';

    // Determine if it's day or night (simple heuristic based on hour)
    const hour = parseInt(formattedTime.split(':')[0]);
    const isDayTime = hour >= 6 && hour < 18;

    return (
        <div className="mb-8 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-indigo-900 rounded-2xl border border-indigo-200 dark:border-indigo-700 shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">World Clock</h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 capitalize">{city}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{timezoneInfo.country}</p>
                </div>
                <div className="text-6xl">{isDayTime ? '☀️' : '🌙'}</div>
            </div>

            {/* Time Display */}
            <div className="text-center mb-6">
                <div className="text-7xl font-bold text-gray-900 dark:text-gray-100 mb-2 font-mono">
                    {formattedTime}
                </div>
                <p className="text-lg text-gray-700 dark:text-gray-300 mb-1">{formattedDate}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Timezone: {offset}</p>
            </div>

            {/* Additional Info */}
            <div className="pt-4 border-t border-indigo-200 dark:border-indigo-700 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Live time • Updates every second
                </p>
            </div>
        </div>
    );
}
