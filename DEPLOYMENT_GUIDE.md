# DoubleVision - Beta Deployment Guide

## Quick Deploy to Vercel (Recommended)

### Step 1: Deploy via Vercel Dashboard

1. **Go to Vercel**
   - Visit https://vercel.com
   - Sign in with your GitHub account (HyperNoodlez)

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select your `DoubleVision` repository
   - Click "Import"

3. **Configure Project**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./` (leave as default)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

### Step 2: Add Environment Variables

In the Vercel project settings, add these environment variables:

```bash
# Database (use your value from .env.local)
MONGODB_URI=your-mongodb-connection-string

# NextAuth
NEXTAUTH_URL=https://your-project.vercel.app  # Vercel will show you this URL
NEXTAUTH_SECRET=your-nextauth-secret-from-env-local

# Google OAuth (use your values from .env.local)
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret

# GitHub OAuth (optional - update if you want GitHub login)
AUTH_GITHUB_ID=your-github-client-id
AUTH_GITHUB_SECRET=your-github-client-secret

# AI Moderation (use your value from .env.local)
GEMINI_API_KEY=your-gemini-api-key

# Storage - NOT NEEDED for Vercel (we'll use Vercel Blob)
# BLOB_READ_WRITE_TOKEN=  # Leave blank for now

# Linear (optional)
# LINEAR_API_KEY=your-linear-api-key
# LINEAR_TEAM_ID=your-linear-team-id
```

### Step 3: Update OAuth Redirect URLs

After deployment, you'll need to update your Google OAuth settings:

1. Go to https://console.cloud.google.com/
2. Navigate to your OAuth 2.0 Client
3. Add these to "Authorized redirect URIs":
   ```
   https://your-project.vercel.app/api/auth/callback/google
   ```

### Step 4: Deploy!

Click "Deploy" and Vercel will:
- ✅ Build your Next.js app
- ✅ Deploy to a production URL
- ✅ Set up automatic deployments for future pushes

---

## Alternative: Deploy via CLI

If you prefer the command line:

```bash
# 1. Login to Vercel (opens browser)
npx vercel login

# 2. Deploy to production
npx vercel --prod

# 3. Add environment variables
npx vercel env add MONGODB_URI
npx vercel env add NEXTAUTH_SECRET
npx vercel env add AUTH_GOOGLE_ID
npx vercel env add AUTH_GOOGLE_SECRET
npx vercel env add GEMINI_API_KEY

# 4. Redeploy to use new environment variables
npx vercel --prod
```

---

## Post-Deployment Checklist

### 1. Update Image Storage for Production

Your current setup stores images in `public/uploads/` which won't work on Vercel (serverless).

**Option A: Use Vercel Blob Storage (Recommended)**

1. Enable Vercel Blob in your project settings
2. Get the `BLOB_READ_WRITE_TOKEN`
3. Update `app/api/upload/route.ts` to use `@vercel/blob`:

```typescript
import { put } from '@vercel/blob';

// Instead of writeFile:
const blob = await put(filename, buffer, {
  access: 'public',
});
const imageUrl = blob.url;
```

**Option B: Use Cloudinary or AWS S3**
- See DEPLOYMENT.md for alternatives

### 2. Test Core Features

After deployment, test:
- ✅ Sign in with Google OAuth
- ✅ Upload a photo (image storage)
- ✅ Submit reviews
- ✅ View feedback
- ✅ Check archive

### 3. Invite Beta Users

Once everything works:

1. **Share the URL**: `https://your-project.vercel.app`
2. **Create a feedback form**: Add Google Form or Typeform for feedback
3. **Monitor**: Check Vercel Analytics and MongoDB Atlas logs
4. **Iterate**: Fix bugs based on user feedback

---

## Important Notes

### Environment Variables Priority

After deployment, update `NEXTAUTH_URL`:
1. Get your Vercel URL (e.g., `https://doublevision-xyz.vercel.app`)
2. Update the environment variable in Vercel
3. Redeploy

### Database Security

Your MongoDB connection string is in the config. Make sure:
- ✅ MongoDB Network Access allows Vercel IPs (or allow all: `0.0.0.0/0`)
- ✅ Database user has appropriate permissions
- ✅ Connection string uses `retryWrites=true`

### File Upload Issue

⚠️ **CRITICAL**: The current file upload saves to `public/uploads/` which won't work on Vercel.

You MUST update to Vercel Blob Storage or another cloud storage before beta testing.

Quick fix in `app/api/upload/route.ts`:

```typescript
// OLD (doesn't work on Vercel):
const filepath = join(process.cwd(), 'public', 'uploads', filename);
await writeFile(filepath, buffer);
const imageUrl = `/uploads/${filename}`;

// NEW (works on Vercel):
import { put } from '@vercel/blob';
const blob = await put(filename, buffer, { access: 'public' });
const imageUrl = blob.url;
```

---

## Monitoring & Support

- **Vercel Dashboard**: Monitor deployments, logs, analytics
- **MongoDB Atlas**: Monitor database usage, slow queries
- **Vercel Logs**: Check function logs for errors

---

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Update OAuth redirect URIs
3. ⚠️ Fix image upload to use Vercel Blob
4. ✅ Test all features
5. ✅ Invite beta users
6. 📊 Collect feedback

Good luck with your beta! 🚀
