"use client";
import { useState, useEffect } from "react";

interface CalculatorProps {
    initialExpression?: string;
}

export default function Calculator({ initialExpression = "" }: CalculatorProps) {
    // Clean initial expression to only valid chars
    const cleanInit = initialExpression.replace(/[^\d\+\-\*\/\(\)\.]/g, '');
    const [display, setDisplay] = useState(cleanInit);
    const [result, setResult] = useState<string | null>(null);

    const calc = () => {
        try {
            // Very basic safety check, though effectively eval is risky in general context.
            // For a calculator tool, we restrict input strictly.
            // eslint-disable-next-line no-new-func
            const func = new Function("return " + display);
            const res = func();
            setResult(String(res));
        } catch (e) {
            setResult("Error");
        }
    };

    // Auto-calculate on mount if expression exists
    useEffect(() => {
        if (initialExpression) calc();
    }, []);

    const handleBtn = (val: string) => {
        if (val === 'C') {
            setDisplay("");
            setResult(null);
        } else if (val === '=') {
            calc();
        } else {
            setDisplay(prev => prev + val);
        }
    };

    return (
        <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm max-w-sm">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Calculator</h3>

            <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg mb-4 text-right">
                <div className="text-gray-500 text-sm h-5">{result !== null ? display + " =" : ""}</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{result !== null ? result : display || "0"}</div>
            </div>

            <div className="grid grid-cols-4 gap-2">
                {['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', 'C', '+'].map(btn => (
                    <button
                        key={btn}
                        onClick={() => handleBtn(btn)}
                        className={`p-3 rounded-lg font-medium transition-colors ${['/', '*', '-', '+'].includes(btn) ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                                btn === 'C' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                                    'bg-gray-50 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
                            }`}
                    >
                        {btn}
                    </button>
                ))}
                <button
                    onClick={() => handleBtn('=')}
                    className="col-span-4 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
                >
                    =
                </button>
            </div>
        </div>
    );
}
