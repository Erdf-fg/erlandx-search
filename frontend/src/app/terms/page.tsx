export default function Terms() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-8 max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-6">Terms of Service</h1>

            <div className="space-y-6 text-gray-700 dark:text-gray-300">
                <p>
                    By using Erlandx, you agree to these terms. Please read them carefully.
                </p>

                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Use of Service</h2>
                <p>
                    You may use our search engine for personal, non-commercial purposes. You agree not to abuse the service with automated bots or scrapers.
                </p>

                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Disclaimer</h2>
                <p>
                    Search results are automated and do not reflect the opinions of Erlandx. We are not responsible for the content of external websites.
                </p>
            </div>

            <div className="mt-12">
                <a href="/" className="text-blue-600 hover:underline">← Back to Search</a>
            </div>
        </div>
    );
}
