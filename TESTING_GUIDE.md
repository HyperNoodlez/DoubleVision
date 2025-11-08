# Testing Guide - Simulated Reviews

This guide explains how to use the simulated review feature to test the feedback viewing experience while you're the only user.

## Overview

Since you're testing DoubleVision alone, I've created a system that generates realistic photography reviews for your uploaded photos. This allows you to:

- Test the feedback viewing experience
- See how different types of reviews are displayed
- Experience the rating system and distribution charts
- Validate the entire user flow without needing other users

## Features

### Realistic Review Perspectives

The system generates 5 reviews from different photography experts:

1. **Emma Rodriguez** (Technical) - Focuses on exposure, focus, composition, technical execution
2. **Marcus Chen** (Artistic) - Emphasizes mood, storytelling, creative vision
3. **Sophia Patel** (Constructive) - Provides balanced critique with improvement suggestions
4. **Alex Thompson** (Encouraging) - Highlights strengths and motivates growth
5. **Jordan Kim** (Balanced) - Combines technical and artistic feedback

### Review Quality

- **Varied ratings**: 1-5 stars based on perspective and analysis
- **Realistic length**: 50-500 words (matching real review requirements)
- **Professional tone**: Written like actual photography critiques
- **Auto-approved**: Bypasses AI moderation for instant testing
- **Unique perspectives**: Each reviewer has a distinct voice and focus area

## How to Use

### Method 1: In-App Button (Easiest)

1. **Start the app**: `npm run dev`
2. **Sign in** to DoubleVision (http://localhost:3001)
3. **Upload a photo** from the dashboard
4. **Navigate to the Feedback page** (or wait to be redirected)
5. **Click "Generate 5 Test Reviews"** button
6. **Refresh the page** to see your reviews!

The button only appears when:
- You have no reviews for the current photo
- The app is in development mode (`NODE_ENV=development`)

### Method 2: Shell Script

```bash
# Upload a photo first, then get its ID from the console or database
./scripts/generate-test-reviews.sh <photoId>
```

Example:
```bash
./scripts/generate-test-reviews.sh 67890abc123def456
```

### Method 3: API Call (Advanced)

```bash
curl -X POST http://localhost:3001/api/simulate-reviews \
  -H "Content-Type: application/json" \
  -d '{"photoId": "your-photo-id-here"}'
```

## Complete Testing Workflow

### First-Time Setup

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Sign in with OAuth** (Google or GitHub)

3. **You'll see**:
   - Dashboard with your stats (0 reviews, 0 photos initially)
   - Upload is locked (requires 5 reviews first)

### Testing the Review System

Since you can't complete real reviews alone, you have two options:

#### Option A: Skip the Review Requirement (Quick Test)
Temporarily modify the upload check to bypass the 5-review requirement for testing.

#### Option B: Create Assignment Workaround
Use the database directly to mark assignments as complete.

**For now, I recommend Option A for quick testing.**

### Testing Feedback View

1. **Upload a photo** from the dashboard
2. **Navigate to Feedback page** (`/feedback`)
3. **Click "Generate 5 Test Reviews"**
4. **Wait for confirmation** (usually < 2 seconds)
5. **Refresh the page** to see:
   - Rating summary with average score
   - Rating distribution chart
   - 5 detailed reviews with stars, comments, word counts
   - Upload date and photo

### Testing Different Scenarios

**Scenario 1: Multiple Photos**
- Upload multiple photos (one per day)
- Generate reviews for each
- View them in the Archive page
- Compare ratings and feedback

**Scenario 2: Rating Variation**
- Generate reviews multiple times (delete old ones first)
- See different rating distributions
- Experience different average scores

**Scenario 3: Review Quality**
- Read the different review styles
- Notice technical vs. artistic perspectives
- See constructive feedback vs. encouragement

## Database Cleanup

If you want to reset and start fresh:

```bash
# Connect to your MongoDB
mongosh "your-mongodb-uri"

# Delete all test reviews
db.reviews.deleteMany({ reviewerId: { $in: [
  "test_emma@doublevision.local",
  "test_marcus@doublevision.local",
  "test_sophia@doublevision.local",
  "test_alex@doublevision.local",
  "test_jordan@doublevision.local"
]}})

# Delete test reviewer accounts (optional)
db.users.deleteMany({ provider: "test" })

# Reset photo review counts (optional)
db.photos.updateMany({}, { $set: { reviewsReceived: 0, averageScore: null }})
```

## How It Works

### Architecture

```
User uploads photo
      ↓
Clicks "Generate Test Reviews"
      ↓
POST /api/simulate-reviews
      ↓
Creates/finds 5 fake reviewer accounts
      ↓
Generates 5 realistic reviews
      ↓
Inserts directly with "approved" status
      ↓
Updates photo review count
      ↓
Returns success
      ↓
User refreshes and sees reviews
```

### Review Templates

The system uses pre-written templates with variables:
- Each expertise type has 3 templates (varying quality levels)
- Templates are selected randomly
- Scores range from 2-5 stars (realistic distribution)
- Word counts vary: 50-500 words
- Creation times are randomized (last hour)

### Fake Reviewers

Fake reviewers have:
- Unique names and emails
- Avatar images (from DiceBear)
- Random but realistic ELO ratings (1000-1400)
- Random review counts (0-50)
- Provider type: "test" (for easy identification)

## Limitations

- **Development only**: This endpoint is disabled in production
- **No ELO impact**: Your ELO rating won't change (you're not the reviewer)
- **No assignments**: Reviews bypass the assignment system
- **Static content**: Reviews are pre-written, not AI-generated per photo
- **No re-generation**: Must delete existing reviews before generating new ones

## Production Considerations

Before deploying:

1. ✅ Endpoint is automatically disabled in production (`NODE_ENV=production`)
2. ✅ UI button only shows in development mode
3. ✅ Fake accounts are clearly marked (`provider: "test"`)
4. ⚠️ Consider adding admin controls to clean up test data
5. ⚠️ Database query to identify and remove test accounts before production

## Troubleshooting

### "Unauthorized" Error
- **Cause**: Not signed in
- **Solution**: Sign in to the app first

### "This endpoint is only available in development mode"
- **Cause**: `NODE_ENV` is set to production
- **Solution**: Check your environment variables

### "Invalid photo ID format"
- **Cause**: Incorrect photo ID
- **Solution**: Copy the exact photo ID from the console or database

### Reviews Already Exist
- **Cause**: Reviews were already generated for this photo
- **Solution**: Delete existing reviews or use a different photo

### Button Doesn't Appear
- **Cause**: Reviews already exist OR not in development mode
- **Solution**: Check both conditions

## Next Steps

After testing with simulated reviews:

1. **Test the archive page** with multiple photos
2. **Verify the rating distribution** calculations
3. **Check responsive design** on mobile
4. **Test edge cases** (no reviews, 1 review, etc.)
5. **Deploy with confidence** knowing the feedback system works!

## Questions?

Check these files to understand the implementation:
- `/app/api/simulate-reviews/route.ts` - API endpoint
- `/components/GenerateTestReviews.tsx` - UI button
- `/app/feedback/page.tsx` - Feedback page integration
- `/lib/db/reviews.ts` - Review database operations

---

**Happy Testing!** 🎉
