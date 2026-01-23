# RoasterOS Deployment Guide

This guide will help you deploy RoasterOS to production so your team can access it online.

## Prerequisites

1. **GitHub Account** - To store your code
2. **Vercel Account** - For hosting the Next.js frontend (free tier available)
3. **Convex Account** - For the database backend (free tier available)

---

## Step 1: Deploy Convex Backend (5 minutes)

### 1.1 Create a Convex Production Deployment

```bash
# Login to Convex (if not already logged in)
npx convex login

# Deploy to production
npx convex deploy
```

This will:
- Create a production deployment on Convex cloud
- Upload your database schema and functions
- Give you a production deployment URL

### 1.2 Save Your Production URL

After running `npx convex deploy`, you'll see output like:
```
✔ Deployed functions to https://your-project-name.convex.cloud
```

**IMPORTANT:** Copy this URL! You'll need it in Step 2.

---

## Step 2: Deploy Next.js Frontend to Vercel (10 minutes)

### 2.1 Push Code to GitHub

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial deployment"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/roasteros.git
git branch -M main
git push -u origin main
```

### 2.2 Deploy to Vercel

**Option A: Using Vercel Dashboard (Recommended for first time)**

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)
   
5. **Add Environment Variable:**
   - Click "Environment Variables"
   - Add: `NEXT_PUBLIC_CONVEX_URL` = `https://your-project-name.convex.cloud` (from Step 1.2)
   
6. Click **Deploy**

**Option B: Using Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# When prompted, set environment variable:
# NEXT_PUBLIC_CONVEX_URL=https://your-project-name.convex.cloud
```

---

## Step 3: Access Your Live App

After deployment completes (2-3 minutes), Vercel will give you a URL like:

```
https://roasteros.vercel.app
```

**Share this URL with your associates!**

---

## Step 4: (Optional) Add Custom Domain

In Vercel Dashboard:
1. Go to your project → **Settings** → **Domains**
2. Add your custom domain (e.g., `app.yourcompany.com`)
3. Update DNS records as instructed by Vercel

---

## Updating the App

Whenever you make changes:

```bash
# Commit changes
git add .
git commit -m "Your update message"
git push

# Vercel will automatically redeploy!
# For Convex changes, run:
npx convex deploy
```

---

## Important Notes

### Data Persistence
- Your Convex production database is **separate** from development
- Development data won't appear in production
- You'll need to re-add inventory, recipes, etc. in production

### Free Tier Limits
- **Vercel:** Unlimited personal projects, 100GB bandwidth/month
- **Convex:** 1M function calls/month, 8GB storage, 1GB bandwidth/day
- Perfect for small teams (5-20 users)

### Security
- No authentication is currently enabled
- Anyone with the URL can access the app
- To add login, we can enable Clerk authentication (already in dependencies)

---

## Troubleshooting

### "Convex URL not found" error
- Make sure `NEXT_PUBLIC_CONVEX_URL` is set in Vercel environment variables
- Redeploy after adding environment variables

### Build fails on Vercel
- Check the build logs in Vercel dashboard
- Common issue: TypeScript errors (we can fix these)

### App is slow
- First load is always slower (cold start)
- Subsequent loads are fast due to Vercel's global CDN

---

## Next Steps After Deployment

1. **Add Authentication** - Enable Clerk for user login
2. **Invite Team** - Share the URL with your associates
3. **Add Production Data** - Create your first batches, recipes, etc.
4. **Monitor Usage** - Check Vercel and Convex dashboards for analytics

---

## Support

If you encounter issues during deployment:
1. Check Vercel deployment logs
2. Check Convex dashboard for backend errors
3. Contact me with the specific error message
