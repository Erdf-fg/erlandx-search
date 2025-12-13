'use client';

interface ImageGalleryProps {
    results: any[];
}

export default function ImageGallery({ results }: ImageGalleryProps) {
    // Filter results that have images
    const imageResults = results.filter(r => r.image && r.image.length > 5);

    if (imageResults.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <p>No images found for this search.</p>
            </div>
        );
    }

    return (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4 pb-12">
            {imageResults.map((result, idx) => (
                <div key={idx} className="break-inside-avoid relative group rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-gray-100 dark:bg-gray-800">
                    <a href={result.url} target="_blank" rel="noopener noreferrer" className="block">
                        <img
                            src={result.image}
                            alt={result.title}
                            className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                            }}
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end min-h-[50%]">
                            <p className="text-white text-sm font-medium line-clamp-2 leading-tight shadow-sm">
                                {result.title}
                            </p>
                            <p className="text-gray-300 text-xs mt-1 truncate">
                                {new URL(result.url).hostname.replace('www.', '')}
                            </p>
                        </div>
                    </a>
                </div>
            ))}
        </div>
    );
}
