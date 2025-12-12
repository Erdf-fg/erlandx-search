"use client";
import { useState, useEffect } from "react";

interface ColorPickerProps {
    color: string;
}

// Convert HEX to RGB
const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

// Convert RGB to HSL
const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }

    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

export default function ColorPicker({ color }: ColorPickerProps) {
    const [copied, setCopied] = useState<string | null>(null);

    // Normalize color input
    let hex = color.startsWith('#') ? color : `#${color}`;
    if (hex.length === 4) {
        hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
    }

    const rgb = hexToRgb(hex);
    const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null;

    const copyToClipboard = (text: string, format: string) => {
        navigator.clipboard.writeText(text);
        setCopied(format);
        setTimeout(() => setCopied(null), 2000);
    };

    if (!rgb) {
        return (
            <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <p className="text-gray-500 dark:text-gray-400">Invalid color format: {color}</p>
            </div>
        );
    }

    const formats = [
        { label: "HEX", value: hex.toUpperCase() },
        { label: "RGB", value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
        { label: "HSL", value: `hsl(${hsl?.h}, ${hsl?.s}%, ${hsl?.l}%)` },
    ];

    return (
        <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Color Picker</h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{hex.toUpperCase()}</p>
                </div>
                <div className="text-4xl">🎨</div>
            </div>

            {/* Color Preview */}
            <div
                className="w-full h-32 rounded-xl mb-6 shadow-inner border border-gray-200 dark:border-gray-600"
                style={{ backgroundColor: hex }}
            />

            {/* Color Formats */}
            <div className="space-y-3">
                {formats.map((format) => (
                    <div
                        key={format.label}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                        <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">{format.label}</span>
                            <p className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100">{format.value}</p>
                        </div>
                        <button
                            onClick={() => copyToClipboard(format.value, format.label)}
                            className={`px-3 py-1 text-xs rounded-lg transition-all ${copied === format.label
                                    ? "bg-green-500 text-white"
                                    : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500"
                                }`}
                        >
                            {copied === format.label ? "Copied!" : "Copy"}
                        </button>
                    </div>
                ))}
            </div>

            {/* Complementary Colors */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-3">Complementary</p>
                <div className="flex gap-2">
                    {[0, 30, 60, 90, 120, 180].map((offset) => {
                        const compH = ((hsl?.h || 0) + offset) % 360;
                        return (
                            <div
                                key={offset}
                                className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:scale-110 transition-transform"
                                style={{ backgroundColor: `hsl(${compH}, ${hsl?.s}%, ${hsl?.l}%)` }}
                                onClick={() => copyToClipboard(`hsl(${compH}, ${hsl?.s}%, ${hsl?.l}%)`, `comp-${offset}`)}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
