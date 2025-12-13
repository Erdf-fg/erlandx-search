import UnitConverter from "./tools/UnitConverter";

interface InstantAnswerProps {
    answer: {
        type: string;
        result?: string;
        formula?: string;
        from_value?: number;
        from_unit?: string;
        to_value?: number;
        to_unit?: string;
        category?: string;
    };
}

export default function InstantAnswer({ answer }: InstantAnswerProps) {
    if (!answer) return null;

    // Direct render for converter type using the interactive widget
    if (answer.type === 'converter') {
        return (
            <UnitConverter
                initialAmount={answer.from_value}
                initialFrom={answer.from_unit}
                initialTo={answer.to_unit}
            />
        );
    }

    return (
        <div className="mb-6 p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300">
            {/* Calculator */}
            {answer.type === 'calculator' && (
                <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Calculator</div>
                    <div className="text-4xl font-light text-gray-900 dark:text-gray-100 mb-2">
                        {answer.result}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {answer.formula}
                    </div>
                </div>
            )}
        </div>
    );
}

