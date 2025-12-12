export default function Privacy() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-8 max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
            <p className="mb-4">Last Updated: December 2025</p>

            <div className="space-y-6 text-gray-700 dark:text-gray-300">
                <p>
                    At Erlandx, we believ privacy is a fundamental right. We design our search engine to minimize data collection.
                </p>

                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">What we collect</h2>
                <p>
                    We log basic search queries to improve our autocomplete and trending features, but this data is anonymized. We do not track your IP address linked to your search history.
                </p>

                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Cookies</h2>
                <p>
                    We use local storage only to remember your theme preference (Dark/Light mode). We do not use tracking cookies.
                </p>
            </div>

            <div className="mt-12">
                <a href="/" className="text-blue-600 hover:underline">← Back to Search</a>
            </div>
        </div>
    );
}
