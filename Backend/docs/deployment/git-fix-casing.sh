#!/bin/bash
# git-fix-casing.sh - Fix Git case sensitivity issues

echo "=========================================="
echo "Git Case Sensitivity Fix"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "composer.json" ]; then
    echo "❌ Error: Not in Backend directory"
    echo "Run this from Backend/ folder"
    exit 1
fi

echo "Checking for case sensitivity issues..."
echo ""

# List files that might have case issues
echo "Files in Api/ folder:"
find app/Http/Controllers/Api -type f -name "*.php" | sort

echo ""
echo "=========================================="
echo "Fix Steps:"
echo "=========================================="
echo ""

# Step 1
echo "[1] Remove old API folder from git tracking"
git rm --cached app/Http/Controllers/API/ -r --force 2>/dev/null || echo "   (No old API/ folder in git)"

# Step 2
echo "[2] Add Api folder with correct casing"
git add app/Http/Controllers/Api/

# Step 3
echo "[3] Verify changes"
git status

echo ""
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo ""
echo "1. Review changes with: git diff --cached"
echo "2. Commit: git commit -m 'fix: PSR-4 casing API → Api'"
echo "3. Push: git push origin main"
echo ""
echo "Then on Linux server:"
echo "  cd Backend"
echo "  rm -f composer.lock"
echo "  composer install --optimize-autoloader"
echo ""
