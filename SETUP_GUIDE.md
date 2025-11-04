# DoubleVision Setup Guide

This guide will help you configure the necessary services to run DoubleVision locally.

## 1. Generate NextAuth Secret

Run this command in your terminal:

```bash
openssl rand -base64 32
```

Copy the output and add it to `.env.local` as `NEXTAUTH_SECRET`

## 2. MongoDB Atlas Setup

### Step 1: Create Account
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up for a free account (no credit card required)

### Step 2: Create Cluster
1. Click "Create" → "Deploy a database"
2. Choose **FREE** M0 tier
3. Select a cloud provider and region (closest to you)
4. Name your cluster (e.g., "DoubleVision")
5. Click "Create Deployment"

### Step 3: Create Database User
1. Choose authentication method: **Username and Password**
2. Create username and strong password
3. **SAVE THESE CREDENTIALS** - you'll need them for the connection string
4. Click "Create Database User"

### Step 4: Configure Network Access
1. Click "Add IP Address"
2. For development, click "Allow Access from Anywhere" (0.0.0.0/0)
   - ⚠️ For production, restrict to specific IPs
3. Click "Confirm"

### Step 5: Get Connection String
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Select "Node.js" driver
4. Copy the connection string
5. Replace `<username>` with your database username
6. Replace `<password>` with your database password
7. Add `/doublevision` after `.net/` to specify database name

Example:
```
mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/doublevision?retryWrites=true&w=majority
```

Add this to `.env.local` as `MONGODB_URI`

## 3. Google OAuth Setup

### Step 1: Create Project
1. Go to https://console.cloud.google.com/
2. Click "Select a project" → "New Project"
3. Name: "DoubleVision"
4. Click "Create"

### Step 2: Configure OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type
3. Fill in:
   - App name: "DoubleVision"
   - User support email: your email
   - Developer contact: your email
4. Click "Save and Continue"
5. Skip "Scopes" (click "Save and Continue")
6. Add test users (your email)
7. Click "Save and Continue"

### Step 3: Create OAuth Credentials
1. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
2. Application type: "Web application"
3. Name: "DoubleVision Web"
4. Authorized JavaScript origins:
   - `http://localhost:3000`
5. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
6. Click "Create"
7. **SAVE** your Client ID and Client Secret
8. Add to `.env.local`:
   - `AUTH_GOOGLE_ID=your-client-id`
   - `AUTH_GOOGLE_SECRET=your-client-secret`

## 4. GitHub OAuth Setup

### Step 1: Create OAuth App
1. Go to https://github.com/settings/developers
2. Click "OAuth Apps" → "New OAuth App"
3. Fill in:
   - Application name: "DoubleVision"
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Click "Register application"

### Step 2: Generate Client Secret
1. Click "Generate a new client secret"
2. **SAVE** your Client ID and Client Secret
3. Add to `.env.local`:
   - `AUTH_GITHUB_ID=your-client-id`
   - `AUTH_GITHUB_SECRET=your-client-secret`

## 5. Verify Configuration

Your `.env.local` should look like this:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/doublevision?retryWrites=true&w=majority

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-generated-secret-here

# Google OAuth
AUTH_GOOGLE_ID=123456789-abc123.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=GOCSPX-abc123def456

# GitHub OAuth
AUTH_GITHUB_ID=Iv1.abc123def456
AUTH_GITHUB_SECRET=abc123def456ghi789
```

## 6. Test Authentication

1. Start the dev server (if not already running):
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000

3. Click "Get Started"

4. Try signing in with Google or GitHub

5. You should be redirected to the dashboard!

## Troubleshooting

### "Invalid OAuth credentials"
- Double-check your Client IDs and Secrets
- Make sure there are no extra spaces
- Verify callback URLs match exactly

### "Can't connect to MongoDB"
- Check your connection string format
- Verify username and password are correct
- Ensure IP address is whitelisted (0.0.0.0/0 for development)
- Check if MongoDB Atlas cluster is running

### "NextAuth error"
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL is `http://localhost:3000`
- Restart dev server after changing .env.local

## Need Help?

- MongoDB Atlas Docs: https://www.mongodb.com/docs/atlas/
- Google OAuth Docs: https://developers.google.com/identity/protocols/oauth2
- GitHub OAuth Docs: https://docs.github.com/en/apps/oauth-apps
- NextAuth.js Docs: https://authjs.dev/
