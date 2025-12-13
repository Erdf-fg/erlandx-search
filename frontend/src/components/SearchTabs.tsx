"use client";

interface SearchTabsProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export default function SearchTabs({ activeTab, onTabChange }: SearchTabsProps) {
    const tabs = [
        { id: 'all', label: 'All' },
        { id: 'images', label: 'Images' },
        { id: 'news', label: 'News' },
    ];

    return (
        <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
            <div className="flex gap-6 overflow-x-auto no-scrollbar">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`pb-3 px-1 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === tab.id
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                            }`}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
