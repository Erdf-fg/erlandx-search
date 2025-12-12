"use client";

interface FeaturedSnippetProps {
    result: {
        title: string;
        url: string;
        snippet: string;
        date?: string | null;
    };
}

export default function FeaturedSnippet({ result }: FeaturedSnippetProps) {
    return (
        <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            {/* Source Header (Google-style) */}
            <div className="flex items-center gap-3 mb-4">
                {/* Favicon Placeholder (In prod, use Google Favicon Service or similar) */}
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500">
                    {result.title.charAt(0)}
                </div>
                <div className="flex flex-col">
                    <a href={result.url} className="text-sm font-medium text-gray-900 dark:text-gray-200 hover:underline">
                        {result.title}
                    </a>
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                        {result.url}
                    </span>
                </div>
            </div>

            {/* The Answer Content */}
            <div className="relative pl-4 border-l-4 border-blue-500">
                <p className="text-xl text-gray-800 dark:text-gray-100 font-medium leading-relaxed">
                    {result.snippet}
                </p>
            </div>

            {/* Date if available */}
            {result.date && (
                <div className="mt-4 text-xs text-gray-400">
                    {new Date(result.date).toLocaleDateString()}
                </div>
            )}
        </div>
    );
}
