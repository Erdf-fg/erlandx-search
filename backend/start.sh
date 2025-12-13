#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status

echo "🚀 Starting Deployment Script..."

# Define directories
DEPLOY_DIR="index_deploy"
# Check if /data is writable (Persistent Storage)
if [ -w "/data" ]; then
    TARGET_DIR="/data/index"
    echo "💾 Using Persistent Storage at $TARGET_DIR"
else
    # Fallback to local
    TARGET_DIR="./data/index"
    echo "⚠️  Persistent Storage not writable/available. Using local: $TARGET_DIR"
fi

# Create target directory if it doesn't exist
mkdir -p "$TARGET_DIR"

echo "📦 Reassembling Index from '$DEPLOY_DIR' to '$TARGET_DIR'..."

# Check if index already exists and is populated
if [ -n "$(ls -A "$TARGET_DIR" 2>/dev/null)" ]; then
    echo "✅ Found existing persistent index in $TARGET_DIR. Skipping initialization/seed."
    # still run init_index.py just to be sure schema is valid (it handles existing index)
    python3 init_index.py
else
    echo "⚠️ Index directory is empty. Initializing..."
    
    # Process all files in deploy dir (only if they exist)
    if [ -d "index_deploy" ]; then
        echo "Processing index files from index_deploy..."
        
        # Check if we have VALID index parts (ignoring .keep or hidden files)
        PART_COUNT=$(ls $DEPLOY_DIR/*.part* 2>/dev/null | wc -l)

        if [ "$PART_COUNT" -gt 0 ]; then
            echo "📦 Found $PART_COUNT index parts. Reassembling..."
            for file in "$DEPLOY_DIR"/*; do
                filename=$(basename "$file")
                
                # Check if it's a part file (e.g., MAIN_xxx.seg.part0)
                if [[ "$filename" == *".part"* ]]; then
                    # Extract base name (MAIN_xxx.seg)
                    # Using parameter expansion to strip longest match of .part* from back
                    base_name="${filename%.part*}"
                    
                    # If this is part0, we start a new file
                    if [[ "$filename" == *".part000" ]]; then
                        echo "   🔨 Reassembling $base_name..."
                        # Cat all parts in order
                        cat "$DEPLOY_DIR/$base_name".part* > "$TARGET_DIR/$base_name"
                    fi
                    # If it's part1, part2, etc., it's already handled by the cat command above
                else
                    # Regular file, just copy
                    # echo "   📄 Copying $filename..."
                    cp "$file" "$TARGET_DIR/$filename"
                fi
            done
        else
            echo "⚠️ No index parts found in index_deploy. Running initial SEED CRAWL..."
            python3 init_index.py
        fi
    else
         python3 init_index.py
    fi
    
    # 1. SMART BACKGROUND CRAWL (Delayed)
    # Wait 30s for Uvicorn to start fully, THEN start crawling.
    echo "This script will start crawling in 30 seconds..."
    (sleep 30 && echo "🕷️ Starting Delayed Crawler..." && python3 seed.py --minutes 2 && python3 continuous_crawl.py) &
fi

# Start Continuous Crawler if we already have index (and skipped delayed seed)
# This condition ensures it only runs if an index was found *or* if parts were reassembled.
# If the index was empty and no parts were found, the delayed crawl handles it.
if [ -n "$(ls -A "$TARGET_DIR" 2>/dev/null)" ]; then
    echo "🕷️  Starting Continuous Crawler in background..."
    python3 continuous_crawl.py &
fi



echo "✅ Index Reassembled successfully!"
echo "🚀 Starting Uvicorn Server..."

# Start the app
uvicorn main:app --host 0.0.0.0 --port ${PORT:-7860}
