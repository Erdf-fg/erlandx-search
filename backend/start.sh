#!/bin/bash

echo "🚀 Starting Deployment Script..."

# Define directories
DEPLOY_DIR="index_deploy"
TARGET_DIR="../data/index"

# Create target directory if it doesn't exist
mkdir -p "$TARGET_DIR"

echo "📦 Reassembling Index from '$DEPLOY_DIR' to '$TARGET_DIR'..."

# Clean target directory to ensure no lock files or corruption
rm -rf "$TARGET_DIR"/*

# Check if we have index parts to deploy
if [ "$(ls -A $DEPLOY_DIR)" ]; then
    echo "📦 Found index parts. Reassembling..."
else
    echo "⚠️ No index parts found. Running initial SEED CRAWL..."
    # Create target dir
    mkdir -p "$TARGET_DIR"
    # Run seed crawl for 2 minutes to get some data
    python3 seed.py --minutes 2
fi

# Process all files in deploy dir
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

echo "✅ Index Reassembled successfully!"
echo "🚀 Starting Uvicorn Server..."

# Start the app
uvicorn main:app --host 0.0.0.0 --port ${PORT:-7860}
