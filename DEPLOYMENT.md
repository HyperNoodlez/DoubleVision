# DoubleVision Deployment Guide

This guide will walk you through deploying DoubleVision to production on Vercel.

## Prerequisites

Before deploying, ensure you have:
- A [Vercel](https://vercel.com) account
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account
- A [Google Cloud Console](https://console.cloud.google.com) account for OAuth
- A [GitHub](https://github.com) account for OAuth
- A [Google AI Studio](https://makersuite.google.com/app/apikey) account for Gemini API
- (Optional) A [Linear](https://linear.app) account for issue tracking

## Step 1: MongoDB Atlas Setup

### 1.1 Create a Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign in or create an account
3. Click "Build a Database"
4. Choose the **FREE** tier (M0 Sandbox)
5. Select your preferred cloud provider and region (choose closest to your users)
6. Name your cluster (e.g., "doublevision")
7. Click "Create Cluster"

### 1.2 Configure Network Access

1. In the Atlas dashboard, click "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development)
   - For production, you can restrict to Vercel's IP ranges
4. Click "Confirm"

### 1.3 Create a Database User

1. Click "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Enter a username (e.g., "doublevision-app")
5. Click "Autogenerate Secure Password" and **save this password**
6. Set privileges to "Read and write to any database"
7. Click "Add User"

### 1.4 Get Connection String

1. Click "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" driver and version "5.5 or later"
5. Copy the connection string
6. Replace `<password>` with the password you saved earlier
7. Replace `<database>` with `doublevision`

Your connection string should look like:
```
mongodb+srv://doublevision-app:<password>@cluster0.xxxxx.mongodb.net/doublevision?retryWrites=true&w=majority
```

## Step 2: Google OAuth Setup

### 2.1 Create a Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a project" → "New Project"
3. Name it "DoubleVision" and click "Create"

### 2.2 Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" and click "Create"
3. Fill in the required fields:
   - App name: "DoubleVision"
   - User support email: Your email
   - Developer contact: Your email
4. Click "Save and Continue"
5. Skip "Scopes" and "Test users"
6. Click "Back to Dashboard"

### 2.3 Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Choose "Web application"
4. Name it "DoubleVision Web"
5. Add Authorized JavaScript origins:
   - `http://localhost:3000` (for local development)
   - `https://your-app-name.vercel.app` (your production URL)
6. Add Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://your-app-name.vercel.app/api/auth/callback/google`
7. Click "Create"
8. **Save the Client ID and Client Secret**

## Step 3: GitHub OAuth Setup

### 3.1 Register OAuth App

1. Go to GitHub Settings → [Developer settings](https://github.com/settings/developers)
2. Click "OAuth Apps" → "New OAuth App"
3. Fill in the fields:
   - Application name: "DoubleVision"
   - Homepage URL: `https://your-app-name.vercel.app`
   - Authorization callback URL: `https://your-app-name.vercel.app/api/auth/callback/github`
4. Click "Register application"
5. Click "Generate a new client secret"
6. **Save the Client ID and Client Secret**

For local development, create another OAuth app with:
- Homepage URL: `http://localhost:3000`
- Callback URL: `http://localhost:3000/api/auth/callback/github`

## Step 4: Google Gemini API Setup

### 4.1 Get API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Select a Google Cloud project or create a new one
5. Click "Create API Key in existing project"
6. **Save the API key**

The Gemini 2.5 Flash model is free with rate limits suitable for development.

## Step 5: Vercel Blob Storage Setup

### 5.1 Create Blob Store

1. Deploy your app to Vercel first (see Step 7)
2. Go to your project in Vercel dashboard
3. Click "Storage" tab
4. Click "Create Database" → "Blob"
5. Name it "doublevision-photos"
6. Select the same region as your deployment
7. Click "Create"
8. The `BLOB_READ_WRITE_TOKEN` will be automatically added to your environment variables

## Step 6: Linear Integration (Optional)

### 6.1 Get API Key

1. Go to [Linear Settings](https://linear.app/settings/api)
2. Click "Personal API keys"
3. Click "Create key"
4. Name it "DoubleVision"
5. **Save the API key**

### 6.2 Get Team ID

1. In Linear, go to your team settings
2. Copy the Team ID from the URL or settings
3. **Save the Team ID**

## Step 7: Deploy to Vercel

### 7.1 Connect Repository

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New" → "Project"
4. Import your GitHub repository
5. Configure the project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: .next

### 7.2 Configure Environment Variables

Click "Environment Variables" and add the following:

**Database:**
```
MONGODB_URI=mongodb+srv://doublevision-app:<password>@cluster0.xxxxx.mongodb.net/doublevision?retryWrites=true&w=majority
```

**Authentication:**
```
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
AUTH_GOOGLE_ID=<your-google-client-id>
AUTH_GOOGLE_SECRET=<your-google-client-secret>
AUTH_GITHUB_ID=<your-github-client-id>
AUTH_GITHUB_SECRET=<your-github-client-secret>
```

To generate NEXTAUTH_SECRET, run:
```bash
openssl rand -base64 32
```

**AI Moderation:**
```
GEMINI_API_KEY=<your-gemini-api-key>
```

**Storage:**
```
BLOB_READ_WRITE_TOKEN=<automatically-added-by-vercel>
```

**Linear (Optional):**
```
LINEAR_API_KEY=<your-linear-api-key>
LINEAR_TEAM_ID=<your-linear-team-id>
```

### 7.3 Deploy

1. Click "Deploy"
2. Wait for the build to complete (2-3 minutes)
3. Click on the deployment URL to visit your app

## Step 8: Post-Deployment Setup

### 8.1 Initialize Database Indexes

The first time someone accesses the app, the database indexes will be created automatically. You can also run this manually:

1. In your local environment, update `.env.local` with production MongoDB URI
2. Run: `node -e "require('./lib/db/index.js').initializeIndexes()"`

### 8.2 Test OAuth Login

1. Visit your deployed app
2. Click "Sign in with Google" and test the flow
3. Click "Sign in with GitHub" and test the flow
4. Verify you can access the dashboard after login

### 8.3 Test Photo Upload

1. Upload a test photo
2. Verify it appears in Vercel Blob Storage dashboard
3. Verify it displays correctly on your dashboard

### 8.4 Test Review System

1. Create a second account (different email)
2. Upload a photo with first account
3. Review it with second account
4. Verify AI moderation runs (check Vercel logs)
5. Verify reviews appear after completing 5

## Step 9: Update OAuth Redirect URLs

After deploying, update your OAuth redirect URLs to use your production domain:

**Google:**
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth client
3. Update redirect URIs to use your Vercel domain

**GitHub:**
1. Go to GitHub OAuth Apps settings
2. Update the callback URL to use your Vercel domain

## Troubleshooting

### Database Connection Issues

If you see "MongoDB connection failed":
- Check that your IP is allowed in MongoDB Atlas Network Access
- Verify the connection string has the correct password
- Ensure the database name is "doublevision"

### OAuth Issues

If OAuth login fails:
- Verify redirect URIs match exactly (including http/https)
- Check that credentials are correctly added to environment variables
- Ensure OAuth consent screen is configured

### Image Upload Issues

If image uploads fail:
- Verify Blob Storage is created and connected
- Check that BLOB_READ_WRITE_TOKEN is set
- Ensure file size is under 10MB

### AI Moderation Issues

If reviews aren't being moderated:
- Check Vercel logs for errors
- Verify GEMINI_API_KEY is set correctly
- Ensure you're not exceeding rate limits

## Production Checklist

Before going live:

- [ ] MongoDB Atlas cluster created and configured
- [ ] Database indexes initialized
- [ ] Google OAuth credentials created and tested
- [ ] GitHub OAuth credentials created and tested
- [ ] Gemini API key created and tested
- [ ] Vercel Blob Storage created and tested
- [ ] All environment variables set in Vercel
- [ ] Production build successful
- [ ] OAuth redirect URLs updated with production domain
- [ ] Test full user flow (signup → upload → review → feedback)
- [ ] Linear integration tested (if enabled)
- [ ] Security headers verified (check with securityheaders.com)
- [ ] Rate limiting tested
- [ ] Error logging verified in production

## Monitoring

### Vercel Analytics

Enable Vercel Analytics for performance monitoring:
1. Go to your project in Vercel
2. Click "Analytics" tab
3. Enable Web Analytics

### Error Tracking (Optional)

For production error tracking, integrate Sentry:
1. Create a Sentry account
2. Add Sentry SDK to the project
3. Configure error reporting in lib/logger.ts

## Scaling Considerations

As your app grows:

1. **Database**: Upgrade MongoDB Atlas tier for better performance
2. **Rate Limiting**: Consider Redis for distributed rate limiting
3. **Image Storage**: Monitor Blob Storage usage and costs
4. **AI Moderation**: Monitor Gemini API usage and consider caching
5. **Hosting**: Vercel scales automatically, but monitor usage

## Support

For issues or questions:
- Check [Next.js Docs](https://nextjs.org/docs)
- Check [MongoDB Atlas Docs](https://docs.atlas.mongodb.com)
- Check [Vercel Docs](https://vercel.com/docs)
- Create an issue in the repository

---

**Congratulations! Your DoubleVision app is now deployed! 🎉**
