
"use client";
import { useState, useEffect } from "react";

interface ConverterProps {
    query?: string;
    initialAmount?: number;
    initialFrom?: string;
    initialTo?: string;
}

const RATES: Record<string, number> = {
    // Length (base: meter)
    'm': 1, 'km': 1000, 'cm': 0.01, 'mi': 1609.34, 'ft': 0.3048, 'in': 0.0254,
    // Mass (base: kg)
    'kg': 1, 'g': 0.001, 'lbs': 0.453592, 'oz': 0.0283495,
    // Currency (Mock rates, base: USD)
    'usd': 1, 'idr': 15500, 'eur': 0.92, 'sgd': 1.34, 'myr': 4.7
};

export default function UnitConverter({ query = "", initialAmount, initialFrom, initialTo }: ConverterProps) {
    // Parse query: "100 usd to idr"
    const parts = query.toLowerCase().split(' ');
    const amtIdx = parts.findIndex(p => !isNaN(parseFloat(p)));
    const toIdx = parts.indexOf('to');

    // Default fallback logic
    const defaultFrom = initialFrom || parts[amtIdx + 1] || 'usd';
    const defaultTo = initialTo || parts[toIdx + 1] || 'idr';
    const defaultAmount = initialAmount !== undefined ? initialAmount : (parseFloat(parts[amtIdx]) || 1);

    const [amount, setAmount] = useState(defaultAmount);
    const [fromUnit, setFromUnit] = useState(defaultFrom);
    const [toUnit, setToUnit] = useState(defaultTo);
    const [result, setResult] = useState<number | null>(null);

    // Determine category based on current unit
    const isCurrency = ['usd', 'idr', 'eur', 'sgd', 'myr'].includes(fromUnit);
    const isLength = ['m', 'km', 'cm', 'mi', 'ft', 'in'].includes(fromUnit);

    // Filter units based on category
    const units = isLength ? ['m', 'km', 'cm', 'mi', 'ft', 'in'] :
        isCurrency ? ['usd', 'idr', 'eur', 'sgd', 'myr'] :
            ['kg', 'g', 'lbs', 'oz']; // default/mass

    // Sync state with query changes
    useEffect(() => {
        const parts = query.toLowerCase().split(' ');
        const amtIdx = parts.findIndex(p => !isNaN(parseFloat(p)));
        const toIdx = parts.indexOf('to');

        if (amtIdx !== -1 && toIdx !== -1) {
            const newFrom = parts[amtIdx + 1] || 'usd';
            const newTo = parts[toIdx + 1] || 'idr';
            const newAmount = parseFloat(parts[amtIdx]) || 1;

            setFromUnit(newFrom);
            setToUnit(newTo);
            setAmount(newAmount);
        }
    }, [query]);

    useEffect(() => {
        calculate();
    }, [amount, fromUnit, toUnit]);

    const calculate = () => {
        const fromRate = RATES[fromUnit];
        const toRate = RATES[toUnit];

        // Ensure both belong to same category logic (base unit conversion)
        // Base logic: Convert FROM -> Base, then Base -> TO
        if (fromRate && toRate) {
            // For currency: 1 * (target / source) ??? No. 
            // RATES are relative to base. 
            // 1 USD = 15500 IDR. 
            // 100 USD -> 100 * 15500.
            // 100 IDR -> 100 / 15500.

            // Wait, my RATES is: 1 unit = X base.
            // If base is Meter: 1 km = 1000 m.
            // If base is USD: 1 IDR = 15500 ?? No. 1 USD = 15500 IDR is typical phrasing but usually rate is Price.
            // Let's standardise: RATES[x] is "Value of 1 Unit in Base".
            // m: 1
            // km: 1000
            // USD: 1
            // IDR: 0.0000645 (1/15500) <-- This is annoying.

            // Alternative: RATES[x] is "How many Base units is 1 Unit".
            // km -> m: 1000.
            // IDR -> USD: 0.0000645.

            // Let's stick to simple logic:
            // Convert everything to BASE first.
            const valInBase = amount * (isCurrency ? (1 / RATES[fromUnit]) : RATES[fromUnit]);
            // Wait, for currency usually we store 1 USD = X.
            // So 100 IDR (if IDR=15500) -> 100/15500 USD.
            // Correct.

            // Exception for my currency const above: 'idr': 15500. This implies 1 USD = 15500 IDR.
            // So if I have 100 USD, I multiply by 15500.
            // If I have 15500 IDR, I divide by 15500.

            let final = 0;
            if (isCurrency) {
                // Currency logic: Amount * (ToRate / FromRate)
                // Ex: 100 USD to IDR -> 100 * (15500 / 1) = 1,550,000.
                // Ex: 100 IDR to USD -> 100 * (1 / 15500) = 0.006.
                final = amount * (RATES[toUnit] / RATES[fromUnit]);
            } else {
                // Metric logic: Amount * FromRate / ToRate
                // Ex: 1 km to m -> 1 * 1000 / 1 = 1000.
                // Ex: 1000 m to km -> 1000 * 1 / 1000 = 1.
                final = (amount * RATES[fromUnit]) / RATES[toUnit];
            }

            setResult(final);
        }
    };

    return (
        <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
                {isCurrency ? 'Currency Converter' : 'Unit Converter'}
            </h3>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex-1 w-full">
                    <input
                        type="number"
                        value={amount}
                        onChange={e => setAmount(parseFloat(e.target.value))}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                    <select
                        value={fromUnit}
                        onChange={e => setFromUnit(e.target.value)}
                        className="w-full mt-2 p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 uppercase text-sm"
                    >
                        {units.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                </div>

                <div className="text-2xl text-gray-400">=</div>

                <div className="flex-1 w-full">
                    <div className="w-full p-3 bg-gray-100 dark:bg-gray-900 rounded-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                        {result ? result.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '...'}
                    </div>
                    <select
                        value={toUnit}
                        onChange={e => setToUnit(e.target.value)}
                        className="w-full mt-2 p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 uppercase text-sm"
                    >
                        {units.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                </div>
            </div>
        </div>
    );
}
