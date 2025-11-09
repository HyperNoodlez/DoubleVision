# DoubleVision - Quick Start Deployment (5 Minutes)

## Fastest Path to Beta Deployment

### 1. Push to GitHub (30 seconds)
```bash
git push origin main
```

### 2. Deploy to Vercel (2 minutes)

**Option A: Using the Dashboard (Easiest)**
1. Go to https://vercel.com/new
2. Sign in with GitHub
3. Click "Import" next to `HyperNoodlez/DoubleVision`
4. Click "Deploy" (it will fail initially - that's okay!)
5. Go to Settings → Environment Variables
6. Add all variables from `.env.local` (see below)
7. Redeploy from Deployments tab

**Option B: Using CLI (Faster if you have it)**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### 3. Add Environment Variables (2 minutes)

In Vercel Dashboard → Settings → Environment Variables, add:

```bash
MONGODB_URI=<your-mongodb-connection-string>
NEXTAUTH_URL=<your-vercel-url>  # e.g., https://doublevision.vercel.app
NEXTAUTH_SECRET=<generate-with: openssl rand -base64 32>
AUTH_GOOGLE_ID=<from-google-console>
AUTH_GOOGLE_SECRET=<from-google-console>
AUTH_GITHUB_ID=<from-github-settings>
AUTH_GITHUB_SECRET=<from-github-settings>
GEMINI_API_KEY=<your-gemini-key>
```

**Important:** Set these for **both** Production and Preview environments!

### 4. Update OAuth Redirect URIs (1 minute)

**Google:**
- Go to https://console.cloud.google.com/apis/credentials
- Add: `https://your-vercel-url.vercel.app/api/auth/callback/google`

**GitHub:**
- Go to https://github.com/settings/developers
- Add: `https://your-vercel-url.vercel.app/api/auth/callback/github`

### 5. Test Your Deployment (30 seconds)
- Visit your Vercel URL
- Test login with Google/GitHub
- Upload a photo
- Submit a review

## Done! 🎉

Your beta is live at: `https://your-app-name.vercel.app`

## Need Help?

- **Full guide:** See `DEPLOYMENT.md`
- **Vercel errors:** Run `vercel logs`
- **Database issues:** Check MongoDB Atlas → Network Access
- **OAuth not working:** Verify redirect URIs match exactly

## Quick Deploy Script

Run this anytime to deploy changes:
```bash
./deploy.sh
```

## Monitoring

Watch logs in real-time:
```bash
vercel logs --follow
```

Check Vercel Dashboard:
https://vercel.com/dashboard
