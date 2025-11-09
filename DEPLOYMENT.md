# DoubleVision - Beta Deployment Guide

This guide will walk you through deploying DoubleVision to production for beta testing.

## Prerequisites

- [x] GitHub repository set up (git@github.com:HyperNoodlez/DoubleVision.git)
- [ ] Vercel account (sign up at https://vercel.com)
- [ ] MongoDB Atlas account (if not already set up)
- [ ] Google OAuth credentials (for production domain)
- [ ] GitHub OAuth credentials (for production domain)
- [ ] Gemini API key

## Deployment Strategy

For beta testing, we'll use **Vercel's Preview Deployments** which gives you:
- Automatic deployments on every git push
- Unique URL for beta testing (e.g., `doublevision-xyz.vercel.app`)
- Easy rollback if issues occur
- Free tier supports beta testing

## Step 1: Push Code to GitHub

```bash
# You should already have committed your beta release
# Now push to GitHub
git push origin main
```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel CLI (Recommended for first-time)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   # From your project directory
   vercel
   ```

   Answer the prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - Project name? `doublevision` (or your choice)
   - Directory? `./`
   - Override settings? **N**

4. **This creates a preview deployment.** To deploy to production:
   ```bash
   vercel --prod
   ```

### Option B: Deploy via Vercel Dashboard (Easier)

1. **Go to https://vercel.com/new**

2. **Import Git Repository:**
   - Click "Import Git Repository"
   - Authorize Vercel to access your GitHub
   - Select `HyperNoodlez/DoubleVision`

3. **Configure Project:**
   - **Project Name:** `doublevision` (or your choice)
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

4. **Add Environment Variables** (see Step 3 below)

5. **Click "Deploy"**

## Step 3: Configure Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables

Add these variables for **Production** and **Preview** environments:

### Required Variables

```bash
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/doublevision

# NextAuth
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=your-production-secret-here

# Google OAuth
AUTH_GOOGLE_ID=your-google-client-id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=your-google-client-secret

# GitHub OAuth
AUTH_GITHUB_ID=your-github-client-id
AUTH_GITHUB_SECRET=your-github-client-secret

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Vercel Blob Storage (auto-configured, but verify)
BLOB_READ_WRITE_TOKEN=vercel_blob_xxx
```

### Important Notes:

**NEXTAUTH_SECRET:**
Generate a new secret for production:
```bash
openssl rand -base64 32
```

**NEXTAUTH_URL:**
- For preview deployments: `https://your-app-name.vercel.app`
- Update after first deployment with actual Vercel URL

**OAuth Redirect URIs:**
You need to update your Google/GitHub OAuth apps with the production callback URLs:
- Google: `https://your-app-name.vercel.app/api/auth/callback/google`
- GitHub: `https://your-app-name.vercel.app/api/auth/callback/github`

## Step 4: Update OAuth Providers

### Google OAuth Console
1. Go to https://console.cloud.google.com/apis/credentials
2. Select your OAuth 2.0 Client ID
3. Add to **Authorized redirect URIs:**
   ```
   https://your-app-name.vercel.app/api/auth/callback/google
   ```

### GitHub OAuth Settings
1. Go to https://github.com/settings/developers
2. Select your OAuth App
3. Update **Authorization callback URL:**
   ```
   https://your-app-name.vercel.app/api/auth/callback/github
   ```

## Step 5: Database Setup (If Not Done)

### MongoDB Atlas Production Database

1. **Go to https://cloud.mongodb.com**

2. **Create a new cluster** (or use existing):
   - Cluster Tier: M0 (Free) is sufficient for beta
   - Region: Choose closest to your users
   - Cluster Name: `DoubleVision-Beta`

3. **Create Database User:**
   - Database Access → Add New Database User
   - Username: `doublevision-prod`
   - Password: Generate strong password
   - Role: Atlas Admin (or Read/Write to specific DB)

4. **Whitelist IP Addresses:**
   - Network Access → Add IP Address
   - **For Vercel:** Add `0.0.0.0/0` (allow from anywhere)
   - Note: This is safe because MongoDB authentication is required

5. **Get Connection String:**
   - Clusters → Connect → Connect your application
   - Copy the connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/doublevision
   ```
   - Add this to Vercel as `MONGODB_URI`

6. **Initialize Database Indexes:**
   After first deployment, the app will auto-create indexes on first use.

## Step 6: Deploy and Test

### First Deployment

After configuring everything:

1. **Trigger Deployment:**
   - Via CLI: `vercel --prod`
   - Via Dashboard: Settings → Git → Redeploy

2. **Monitor Build:**
   - Watch the deployment logs in Vercel Dashboard
   - Build should complete in 2-3 minutes

3. **Check Deployment URL:**
   - Vercel will provide a URL like: `https://doublevision-xyz.vercel.app`
   - This is your beta testing URL

### Initial Testing Checklist

- [ ] Visit the deployment URL
- [ ] Test Google OAuth login
- [ ] Test GitHub OAuth login
- [ ] Upload a test photo
- [ ] Submit a test review
- [ ] Check MongoDB to verify data is being saved
- [ ] Test AI moderation (submit good and bad reviews)
- [ ] Test strike system
- [ ] Check photo feedback page
- [ ] Test review rating system

## Step 7: Share with Beta Users

### Beta User Access

1. **Share the URL:** `https://your-app-name.vercel.app`

2. **Provide Instructions:**
   - Point users to the README.md for onboarding
   - Explain community guidelines
   - Set expectations (beta = bugs possible)

3. **Collect Feedback:**
   - Set up a feedback channel (email, Discord, Slack, etc.)
   - Monitor Vercel logs for errors
   - Check MongoDB for data issues

### Beta Testing Best Practices

**Limit Initial Users:**
- Start with 5-10 trusted users
- Expand gradually based on stability

**Monitor Closely:**
```bash
# Watch Vercel logs in real-time
vercel logs --follow
```

**Rate Limiting:**
Your app already has rate limiting configured in `/lib/rateLimit.ts`

**Database Monitoring:**
- MongoDB Atlas → Metrics → Monitor queries and performance
- Set up alerts for high usage

## Step 8: Custom Domain (Optional)

If you want a custom domain instead of `*.vercel.app`:

1. **Purchase Domain** (e.g., from Namecheap, Google Domains)

2. **Add to Vercel:**
   - Settings → Domains → Add Domain
   - Follow Vercel's DNS configuration instructions

3. **Update Environment Variables:**
   - Change `NEXTAUTH_URL` to your custom domain
   - Update OAuth redirect URIs

4. **SSL Certificate:**
   - Vercel auto-provisions Let's Encrypt SSL
   - HTTPS works automatically

## Troubleshooting

### Build Fails

**Check logs:**
```bash
vercel logs
```

**Common issues:**
- Missing environment variables
- TypeScript errors (run `npm run build` locally first)
- Dependency issues (ensure `package-lock.json` is committed)

### OAuth Not Working

**Verify:**
- `NEXTAUTH_URL` matches deployment URL exactly
- OAuth redirect URIs are updated in Google/GitHub
- `NEXTAUTH_SECRET` is set in Vercel

### Database Connection Issues

**Verify:**
- MongoDB connection string is correct
- Database user credentials are correct
- IP whitelist includes `0.0.0.0/0`
- Network access is enabled

### AI Moderation Errors

**Verify:**
- `GEMINI_API_KEY` is set correctly
- API key has sufficient quota
- Check Vercel function logs for API errors

## Monitoring and Analytics

### Vercel Analytics

Enable in Dashboard → Analytics:
- Web Vitals monitoring
- Traffic analytics
- Error tracking

### MongoDB Monitoring

Atlas Dashboard → Metrics:
- Query performance
- Connection count
- Data size

### Application Logging

Logs available at:
```bash
vercel logs --follow
```

Or in Dashboard → Deployments → Click deployment → Logs

## Scaling Considerations

### When to Upgrade

**Vercel:**
- Free tier: 100GB bandwidth, unlimited deployments
- Upgrade to Pro ($20/mo) for:
  - Higher bandwidth limits
  - Better performance
  - Team collaboration

**MongoDB:**
- M0 Free tier: 512MB storage, shared resources
- Upgrade to M10 ($0.08/hr) when:
  - Storage exceeds 500MB
  - Need better performance
  - More concurrent connections

### Performance Optimization

Current optimizations:
- ✅ Rate limiting implemented
- ✅ MongoDB indexes configured
- ✅ Image optimization with Vercel Blob
- ✅ Next.js 15 App Router (optimized SSR)

Future optimizations:
- Add Redis caching (Vercel KV)
- Implement CDN for images
- Add database read replicas

## Rollback Strategy

### If Issues Occur

1. **Instant Rollback:**
   - Vercel Dashboard → Deployments
   - Find previous working deployment
   - Click "..." → Promote to Production

2. **Via CLI:**
   ```bash
   vercel rollback
   ```

3. **Database Rollback:**
   - MongoDB Atlas → Backup & Restore
   - Restore to previous snapshot

## Beta Release Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variables configured
- [ ] OAuth providers updated
- [ ] MongoDB Atlas configured
- [ ] First deployment successful
- [ ] All features tested
- [ ] Beta users invited
- [ ] Monitoring enabled
- [ ] Backup strategy in place

## Next Steps After Beta

1. **Gather Feedback:** 2-4 weeks of beta testing
2. **Fix Bugs:** Address issues found by beta users
3. **Optimize:** Based on usage patterns
4. **Public Launch:** Expand to wider audience
5. **Marketing:** Share on social media, photography communities

## Support

**Questions during deployment?**
- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com
- Next.js Docs: https://nextjs.org/docs

**DoubleVision specific issues?**
- Check application logs in Vercel
- Review MongoDB queries in Atlas
- Test locally first with `npm run dev`

---

**Ready to deploy?** Start with Step 1 and follow the guide sequentially. Good luck with your beta launch! 🚀
