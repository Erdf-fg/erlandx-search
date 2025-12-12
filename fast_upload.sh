#!/bin/bash

# Fast Upload Script for Erlandx Search
# Solves "File too large" and "Too many files" issues automatically.

echo "🚀 Erlandx Auto-Uploader"
echo "========================"


# 0. Clean Start Option
echo "♻️  Apakah mau RESET TOTAL history Git? (Pilih 'y' jika sebelumnya gagal upload karena file size)"
echo "   (Ini akan menghapus history commit lama dan mulai bersih)"
read -p "   Reset? (y/n): " DO_RESET

if [ "$DO_RESET" = "y" ]; then
    echo "🧹 Menghapus history git lama..."
    rm -rf .git
    git init
    git branch -M main
    echo "✅ Git di-reset."
fi

# 1. Ask for GitHub URL
echo "Masukkan Link Repository GitHub kamu (contoh: https://github.com/user/repo.git):"
echo "Jika sudah pernah di-set, langsung tekan ENTER."
read REPO_URL

# 2. Add Remote if provided
if [ ! -z "$REPO_URL" ]; then
    git remote remove origin 2> /dev/null
    git remote add origin "$REPO_URL"
    echo "✅ GitHub Remote set to: $REPO_URL"
fi

# Check if remote exists
REMOTE_CHECK=$(git remote -v)
if [ -z "$REMOTE_CHECK" ]; then
    echo "❌ Error: Belum ada link GitHub. Silakan jalankan ulang script ini dan paste link-nya."
    exit 1
fi

echo "📦 Preparing files..."

# 3. Fix Nested Git Issues (Frontend)
if [ -d "frontend/.git" ]; then
    echo "🔧 Fixing frontend git config..."
    rm -rf frontend/.git
    git rm --cached frontend 2>/dev/null
fi

# 4. Git Operations
git add .
git commit -m "Deploy Erlandx Search (Automated)"

echo "⬆️  Uploading to GitHub (ini mungkin butuh beberapa detik)..."

# 5. Push to GitHub
echo "⬆️  Uploading to GitHub..."
git branch -M main
git push -u origin main --force

# 6. Push to Hugging Face (Optional but Recommended)
echo ""
echo "🚀 Mau deploy ke Hugging Face juga? (Recommended)"
echo "Masukkan Link Space Hugging Face (contoh: https://huggingface.co/spaces/User/repo):"
echo "Tekan ENTER jika tidak ingin deploy ke HF."
read HF_URL

if [ ! -z "$HF_URL" ]; then
    echo "🔗 Connecting to Hugging Face..."
    git remote remove hf 2> /dev/null
    git remote add hf "$HF_URL"
    
    echo "⬆️  Uploading to Hugging Face..."
    echo "⚠️  Saat diminta PASSWORD, masukkan **ACCESS TOKEN** (bukan password login)."
    echo "⚠️  (Buat token di: https://huggingface.co/settings/tokens)"
    git push hf main:main --force
    
    if [ $? -eq 0 ]; then
        echo "✅ SUCCESS! Erlandx Search sedang di-build di Hugging Face."
    else
        echo "❌ Gagal push ke Hugging Face. Cek token/koneksi."
    fi
fi

if [ $? -eq 0 ]; then
    echo "✅ Selesai."
else
    echo "⚠️ Selesai dengan peringatan."
fi
