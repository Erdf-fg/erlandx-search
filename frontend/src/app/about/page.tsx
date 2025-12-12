export default function About() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-8 max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-6">About Erlandx</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                Erlandx Search is built with a simple mission: to provide relevant, fast, and neutral search results without the clutter.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">Our Values</h2>
            <ul className="list-disc ml-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>**Speed**: Information should be accessible instantly.</li>
                <li>**Privacy**: We do not build a profile of you.</li>
                <li>**Transparency**: You should know where your results come from.</li>
            </ul>

            <div className="mt-12">
                <a href="/" className="text-blue-600 hover:underline">← Back to Search</a>
            </div>
        </div>
    );
}
