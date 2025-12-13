export default function HowSearchWorks() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-8 max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-6">How Search Works</h1>

            <div className="space-y-8">
                <section>
                    <h2 className="text-2xl font-semibold mb-2">1. Crawling</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Our automated crawlers browse the web, looking for pages and following links, much like you would. They discover content 24/7.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-2">2. Indexing</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        We store the content we find in a massive index. We analyze text, images, and other content to understand what each page is about.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-2">3. Ranking</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        When you type a query, our algorithms search the index for matching pages. We rank them based on relevance (keywords, title matches) and authority (how many other sites link to them).
                    </p>
                </section>
            </div>

            <div className="mt-12">
                <a href="/" className="text-blue-600 hover:underline">← Back to Search</a>
            </div>
        </div>
    );
}
