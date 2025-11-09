# AI Moderation System - Configuration Guide

## Overview

DoubleVision uses **Gemini 2.0 Flash** to automatically moderate photo review comments. The moderation system checks for:

1. **Offensive content** - harassment, hate speech, personal attacks
2. **AI-generated content** - generic, template-like feedback
3. **Irrelevant content** - spam, off-topic discussions

Reviews are automatically approved or rejected based on AI confidence scores. Rejected reviews with high confidence trigger alerts in Linear for manual review.

## Configuration File

All moderation settings are in: **`config/moderator.ts`**

### Key Settings

```typescript
export const MODERATOR_CONFIG = {
  // Gemini model version
  model: "gemini-2.0-flash-exp",

  // Confidence thresholds for rejection
  thresholds: {
    offensiveConfidence: 70,     // Reject offensive content at 70%+ confidence
    irrelevanceConfidence: 80,   // Reject irrelevant content at 80%+ confidence
    linearAlertConfidence: 70,   // Create Linear alerts at 70%+ confidence
  },
};
```

### System Prompt

The `MODERATOR_SYSTEM_PROMPT` defines Gemini's role and guidelines. It includes:

- **Role definition**: What the AI moderator is responsible for
- **Red flags**: Specific examples of content to flag
- **Nuances**: Edge cases and cultural considerations
- **Examples**: Sample reviews with expected outcomes
- **Response format**: JSON structure for moderation results

## How It Works

### 1. Review Submission

When a user submits a review (`POST /api/reviews`):

1. Basic validation (word count, score range, etc.)
2. Review is saved to database with `moderationStatus: "pending"`
3. Response sent to user immediately (doesn't block)
4. **Background moderation starts asynchronously**

### 2. AI Moderation (Background)

The system calls Gemini with the review comment:

```typescript
const aiAnalysis = await moderateReview(comment);
```

Gemini responds with:

```json
{
  "isOffensive": false,
  "isAiGenerated": false,
  "isRelevant": true,
  "confidence": 85,
  "reasoning": "Specific technical feedback about composition"
}
```

### 3. Decision Making

The `getModerationDecision()` function applies thresholds:

- **Reject** if `isOffensive: true` AND `confidence >= 70%`
- **Reject** if `isRelevant: false` AND `confidence >= 80%`
- **Note** `isAiGenerated` flag but don't auto-reject (AI assistance is OK)
- **Default** to approval (bias toward allowing content)

### 4. ELO Rating Update

After moderation:

- **Approved reviews**: Increase reviewer's ELO rating
- **Rejected reviews**: Decrease reviewer's ELO rating
- Confidence score affects magnitude of ELO change
- Word count also factors into ELO calculation

### 5. Linear Alerts (High-Confidence Rejections)

If a review is rejected with `confidence >= 70%`, the system creates a Linear issue:

- Includes review text and reasoning
- Marks as "offensive", "irrelevant", or "ai-generated"
- Allows manual review and potential override

## Testing the Moderation System

### 1. Check Environment Variables

Ensure your `.env.local` has:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

Get a Gemini API key from: https://ai.google.dev/

### 2. Test with Sample Reviews

Submit reviews through the app (`/review` page) with different content:

#### ✅ Should APPROVE

```
"The composition follows the rule of thirds nicely, with your subject positioned at the intersection. However, I'd recommend shooting at f/8 instead of f/4 to get more of the scene in focus. The golden hour lighting is beautiful here."
```

Expected: `isRelevant: true, confidence: 85%` → **APPROVED**

#### ❌ Should REJECT - Offensive

```
"This is absolute garbage. Why do you even bother taking photos? You have zero talent and should give up."
```

Expected: `isOffensive: true, confidence: 95%` → **REJECTED** + Linear alert

#### ❌ Should REJECT - Irrelevant

```
"Great pic! Follow me @photospammer on Instagram for daily photography tips! Click the link in my bio for a free ebook!!!"
```

Expected: `isRelevant: false, confidence: 90%` → **REJECTED** + Linear alert

#### ⚠️ Borderline - Generic but OK

```
"Nice photo! I really like the colors and composition. Keep up the good work and keep practicing!"
```

Expected: `isAiGenerated: possibly true, confidence: 60%` → **APPROVED** (default to allowing)

### 3. Monitor Logs

Watch the server console for moderation logs:

```bash
npm run dev
```

Look for:

- `✅ Review {id} moderated: approved`
- `✅ Review {id} moderated: rejected`
- `🚨 High-confidence rejection (X%) - Linear alert created`
- `📊 ELO updated for reviewer {id}: X → Y (+Z)`

### 4. Check Database

Query the `reviews` collection to see moderation results:

```javascript
db.reviews.find({ moderationStatus: "rejected" })
```

Each review has an `aiAnalysis` field:

```javascript
{
  _id: "...",
  photoId: "...",
  reviewerId: "...",
  score: 85,
  comment: "...",
  moderationStatus: "approved",  // or "rejected"
  aiAnalysis: {
    isOffensive: false,
    isAiGenerated: false,
    isRelevant: true,
    confidence: 85,
    reasoning: "Specific technical feedback"
  }
}
```

## Modifying the System Prompt

The system prompt is in `config/moderator.ts` in the `MODERATOR_SYSTEM_PROMPT` constant.

### Tips for Prompt Modification

1. **Be specific**: Give clear examples of what to flag
2. **Include edge cases**: Address nuances (technical language, cultural differences)
3. **Set expectations**: Define confidence score ranges
4. **Bias toward approval**: Photography platforms benefit from feedback flow
5. **Test incrementally**: Change one thing at a time and test

### Example: Making Moderation Stricter

To reject more AI-generated content:

```typescript
// In config/moderator.ts

export const MODERATOR_CONFIG = {
  thresholds: {
    offensiveConfidence: 70,
    irrelevanceConfidence: 80,
    aiGeneratedConfidence: 75,  // Add new threshold
  },
};
```

Then update `getModerationDecision()` in `lib/gemini.ts`:

```typescript
// Reject if AI-generated with high confidence
if (moderation.isAiGenerated && moderation.confidence >= 75) {
  return "rejected";
}
```

## Troubleshooting

### Moderation Not Running

**Check API key:**

```bash
grep GEMINI_API_KEY .env.local
```

**Check console logs:**

- `⚠️ GEMINI_API_KEY not configured` → Add API key to `.env.local`
- `Gemini API not configured, skipping moderation` → Same issue

### All Reviews Approved

**Check confidence thresholds:**

- Thresholds might be too high (e.g., 90%+)
- Gemini might be uncertain (50-60% confidence)
- Review prompt for specificity

**Test with obviously bad content:**

Submit a review with clear profanity. If it's approved, check logs for the `confidence` score returned by Gemini.

### All Reviews Rejected

**Check confidence thresholds:**

- Thresholds might be too low (e.g., 30%)
- Lower thresholds to 60-70%

**Review system prompt:**

- Might be too strict
- Add more "approval" examples
- Emphasize "bias toward approval"

### Gemini Not Responding

**Check API errors in console:**

- Rate limiting (600 requests/minute for free tier)
- Invalid API key
- Network issues

**Fallback behavior:**

If Gemini fails, the system defaults to **approval** for safety (better to allow content than block legitimate feedback).

## Model Upgrades

Currently using: **Gemini 2.0 Flash Exp** (experimental)

To upgrade:

1. Check available models: https://ai.google.dev/models
2. Update `config/moderator.ts`:

```typescript
export const MODERATOR_CONFIG = {
  model: "gemini-2.5-flash",  // or latest version
};
```

3. Test thoroughly with sample reviews
4. Monitor confidence scores and accuracy

## Files Modified

- **`config/moderator.ts`** - Main configuration and system prompt
- **`lib/gemini.ts`** - Gemini API integration
- **`app/api/reviews/route.ts`** - Review submission with async moderation
- **`lib/db/reviews.ts`** - Database functions for moderation status

## Additional Resources

- **Gemini API Docs**: https://ai.google.dev/docs
- **Prompt Engineering Guide**: https://ai.google.dev/docs/prompt_best_practices
- **Linear API** (for alerts): https://developers.linear.app/

---

**Questions?** Check the console logs first, they provide detailed moderation information for every review submitted.
