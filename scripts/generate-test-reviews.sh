#!/bin/bash

# Generate Test Reviews Script
# This script generates simulated reviews for testing the feedback view

echo "🎬 DoubleVision Test Review Generator"
echo "======================================"
echo ""

# Check if photoId is provided
if [ -z "$1" ]; then
  echo "❌ Error: Please provide a photo ID"
  echo ""
  echo "Usage: ./scripts/generate-test-reviews.sh <photoId>"
  echo ""
  echo "To get your photo ID:"
  echo "1. Upload a photo in the app"
  echo "2. Check the browser console or database for the photo ID"
  echo "3. Or run: npm run db:list-photos"
  exit 1
fi

PHOTO_ID=$1
API_URL="http://localhost:3001/api/simulate-reviews"

echo "📸 Photo ID: $PHOTO_ID"
echo "🔗 API URL: $API_URL"
echo ""
echo "Generating 5 simulated reviews..."
echo ""

# Make the API call
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"photoId\":\"$PHOTO_ID\"}" \
  -c cookies.txt \
  -b cookies.txt)

# Check if response contains error
if echo "$RESPONSE" | grep -q "error"; then
  echo "❌ Error occurred:"
  echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
  echo ""
  echo "Common issues:"
  echo "1. Make sure you're logged in to the app first"
  echo "2. Verify the photo ID is correct"
  echo "3. Check that the dev server is running on port 3001"
  exit 1
fi

# Pretty print the response
echo "✅ Success!"
echo ""
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
echo ""
echo "🎉 Reviews generated! View them at: http://localhost:3001/feedback"

# Clean up cookies file
rm -f cookies.txt
