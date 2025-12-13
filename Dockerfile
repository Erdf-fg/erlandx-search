# Switch to standard Python image to bypass MCR registry issues (403 Forbidden)
FROM python:3.10-slim

# Install system dependencies required for Playwright/Browsers
# We install fundamental tools + deps for chromium manually because 'playwright install-deps' fails on Debian Trixie
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    libglib2.0-0 \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxcb1 \
    libxkbcommon0 \
    libx11-6 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Handle User 1000 (Hugging Face Requirement) - Create EARLY
RUN useradd -m -u 1000 user || echo "User 1000 already exists, skipping creation."

# Copy backend files
COPY backend/ ./backend/

# Install Python dependencies (Global is fine)
WORKDIR /app/backend
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install playwright

# Ensure permissions
RUN chown -R 1000:1000 /app
RUN chmod +x start.sh

# Switch to UID 1000 BEFORE installing browsers
USER 1000
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Install Browsers AS USER (Installs to ~/.cache/ms-playwright)
RUN playwright install chromium

# Expose Hugging Face default port
EXPOSE 7860

# Run the start script
CMD ["./start.sh"]
