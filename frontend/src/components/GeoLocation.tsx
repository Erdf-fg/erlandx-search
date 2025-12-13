"use client";
import { useState, useEffect } from "react";

interface GeoLocationProps {
    query: string;
}

interface LocationData {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
}

export default function GeoLocation({ query }: GeoLocationProps) {
    const [location, setLocation] = useState<LocationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Check if query is asking for location
        const isNearMeQuery = /near\s*me|terdekat|nearby|lokasi\s*saya/i.test(query);

        if (isNearMeQuery) {
            requestLocation();
        }
    }, [query]);

    const requestLocation = () => {
        setLoading(true);
        setError(null);

        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                // Reverse geocoding to get city/country (using free API)
                try {
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
                    );
                    const data = await res.json();

                    setLocation({
                        latitude,
                        longitude,
                        city: data.address?.city || data.address?.town || data.address?.village,
                        country: data.address?.country
                    });
                } catch {
                    setLocation({ latitude, longitude });
                }

                setLoading(false);
            },
            (err) => {
                setError("Unable to retrieve your location");
                setLoading(false);
            }
        );
    };

    if (!location && !loading && !error) return null;

    return (
        <div className="mb-6 p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-green-900 rounded-xl border border-green-200 dark:border-green-700">
            <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">📍</span>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Your Location</h3>
            </div>

            {loading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">Detecting location...</p>
            ) : error ? (
                <div>
                    <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
                    <button
                        onClick={requestLocation}
                        className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        Try again
                    </button>
                </div>
            ) : location ? (
                <div className="space-y-2">
                    {location.city && (
                        <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            {location.city}, {location.country}
                        </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Coordinates: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                    </p>
                    <a
                        href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        View on Google Maps →
                    </a>
                </div>
            ) : null}
        </div>
    );
}
