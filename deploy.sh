#!/bin/bash
# DoubleVision - Quick Deploy Script

set -e  # Exit on error

echo "🚀 DoubleVision Beta Deployment"
echo "================================"
echo ""

# Check if on main branch
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
    echo "⚠️  You're on branch '$BRANCH', not 'main'"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  You have uncommitted changes"
    git status --short
    echo ""
    read -p "Commit changes first? (Y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        read -p "Enter commit message: " COMMIT_MSG
        git add -A
        git commit -m "$COMMIT_MSG"
    fi
fi

# Push to GitHub
echo ""
echo "📤 Pushing to GitHub..."
git push origin "$BRANCH"
echo "✅ Pushed to GitHub"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo ""
    echo "⚠️  Vercel CLI not found"
    echo "Install with: npm i -g vercel"
    echo ""
    read -p "Continue without deploying? (Y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        exit 1
    fi
    exit 0
fi

# Deploy to Vercel
echo ""
read -p "Deploy to Vercel now? (Y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    echo ""
    echo "🌐 Deploying to Vercel..."
    vercel --prod
    echo ""
    echo "✅ Deployment complete!"
    echo ""
    echo "Next steps:"
    echo "1. Check the deployment URL provided above"
    echo "2. Test all features (login, upload, review)"
    echo "3. Monitor logs with: vercel logs --follow"
    echo "4. Share with beta testers!"
fi
