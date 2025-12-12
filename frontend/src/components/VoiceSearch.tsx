'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface VoiceSearchProps {
    onResult: (transcript: string) => void;
    onClose: () => void;
}

export default function VoiceSearch({ onResult, onClose }: VoiceSearchProps) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [volume, setVolume] = useState(0);

    useEffect(() => {
        // Check browser support
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            setError('Browser tidak mendukung Voice Search. Gunakan Chrome/Edge.');
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'id-ID'; // Indonesian, fallback to English

        recognition.onstart = () => {
            setIsListening(true);
            setError(null);
        };

        recognition.onresult = (event: any) => {
            const current = event.resultIndex;
            const result = event.results[current];
            const text = result[0].transcript;

            setTranscript(text);

            // Simulate volume based on confidence
            setVolume(result[0].confidence * 100);

            if (result.isFinal) {
                setTimeout(() => {
                    onResult(text);
                    onClose();
                }, 500);
            }
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            switch (event.error) {
                case 'no-speech':
                    setError('Tidak ada suara terdeteksi. Coba lagi.');
                    break;
                case 'not-allowed':
                case 'service-not-allowed':
                    setError('Akses mikrofon ditolak. Izinkan di settings browser.');
                    break;
                case 'network':
                    setError('Koneksi internet diperlukan untuk voice search. Pastikan terhubung ke internet.');
                    break;
                case 'audio-capture':
                    setError('Tidak dapat mengakses mikrofon. Pastikan mikrofon terhubung.');
                    break;
                case 'aborted':
                    // User cancelled, no error message needed
                    break;
                default:
                    setError(`Error: ${event.error}. Coba lagi.`);
            }
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        // Start listening
        try {
            recognition.start();
        } catch (e) {
            console.error('Failed to start recognition:', e);
        }

        return () => {
            recognition.stop();
        };
    }, [onResult, onClose]);

    // Animated volume bars
    const volumeBars = [0.4, 0.7, 1, 0.8, 0.5, 0.9, 0.6, 0.75, 0.85];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-md mx-4">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 text-white/70 hover:text-white text-lg"
                >
                    ✕ Tutup
                </button>

                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-2xl border border-gray-700">
                    {/* Microphone icon with pulse */}
                    <div className="flex justify-center mb-6">
                        <div className={`relative ${isListening ? 'animate-pulse' : ''}`}>
                            {/* Pulse rings */}
                            {isListening && (
                                <>
                                    <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" style={{ animationDuration: '1.5s' }}></div>
                                    <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }}></div>
                                </>
                            )}

                            <div className={`w-24 h-24 rounded-full flex items-center justify-center ${isListening
                                ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                                : 'bg-gray-700'
                                }`}>
                                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93h2c0 3.03 2.47 5.5 5.5 5.5S17 11.03 17 8h2c0 4.08-3.06 7.44-7 7.93V20h4v2H8v-2h4v-4.07z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Volume visualizer */}
                    {isListening && (
                        <div className="flex justify-center items-end gap-1 h-12 mb-6">
                            {volumeBars.map((height, i) => (
                                <div
                                    key={i}
                                    className="w-2 bg-gradient-to-t from-blue-500 to-purple-500 rounded-full transition-all duration-150"
                                    style={{
                                        height: `${(volume * height * 0.4) + 8}px`,
                                        animationDelay: `${i * 50}ms`
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Status text */}
                    <div className="text-center">
                        {error ? (
                            <p className="text-red-400 text-sm">{error}</p>
                        ) : isListening ? (
                            <p className="text-blue-400 text-lg animate-pulse">Mendengarkan...</p>
                        ) : (
                            <p className="text-gray-400">Memulai...</p>
                        )}
                    </div>

                    {/* Transcript */}
                    {transcript && (
                        <div className="mt-6 p-4 bg-gray-800/50 rounded-xl">
                            <p className="text-white text-xl text-center font-medium">
                                "{transcript}"
                            </p>
                        </div>
                    )}

                    {/* Language hint */}
                    <p className="text-gray-500 text-xs text-center mt-6">
                        🇮🇩 Bahasa Indonesia / 🇬🇧 English
                    </p>
                </div>
            </div>
        </div>
    );
}
