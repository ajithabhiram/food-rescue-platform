# 🚀 Railway Deployment Guide

## Prerequisites
- GitHub account
- Railway account (sign up at https://railway.app)
- Supabase project set up

---

## Step 1: Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Food Rescue Platform"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR-USERNAME/food-rescue-platform.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy on Railway

1. Go to https://railway.app
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository
5. Railway will auto-detect Next.js

---

## Step 3: Add Environment Variables

In Railway dashboard → **Variables** tab, add:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token (optional)
```

---

## Step 4: Configure Build Settings

Railway should auto-detect these, but verify:

- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Install Command:** `npm install`

---

## Step 5: Deploy

Railway will automatically deploy. Wait for:
- ✅ Build complete
- ✅ Deploy complete
- ✅ Domain assigned

---

## Step 6: Get Your URL

Railway will give you a URL like:
```
https://your-app.up.railway.app
```

---

## Step 7: Update Supabase Settings

In **Supabase Dashboard** → **Authentication** → **URL Configuration**:

Add your Railway URL to:
- **Site URL:** `https://your-app.up.railway.app`
- **Redirect URLs:** `https://your-app.up.railway.app/**`

---

## Step 8: Test Your Deployment

1. Visit your Railway URL
2. Sign up as a user
3. Test all features
4. Check admin dashboard

---

## Troubleshooting

### Build fails:
- Check Railway logs
- Verify environment variables
- Ensure all dependencies in package.json

### Can't sign in:
- Check Supabase redirect URLs
- Verify environment variables

### 404 errors:
- Ensure Next.js build completed
- Check Railway deployment logs

---

## Custom Domain (Optional)

1. Railway dashboard → **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter your domain
4. Add DNS records as shown
5. Wait for SSL certificate

---

## Continuous Deployment

Railway automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "Update feature"
git push
```

Railway will rebuild and redeploy automatically! 🚀

---

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| NEXT_PUBLIC_SUPABASE_URL | Your Supabase project URL | Yes |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anonymous key | Yes |
| NEXT_PUBLIC_MAPBOX_TOKEN | Mapbox API token | No |

---

## Production Checklist

- [ ] Environment variables added
- [ ] Supabase redirect URLs updated
- [ ] Database schema deployed
- [ ] Email templates added
- [ ] Admin account created
- [ ] Test signup/login
- [ ] Test partner approval
- [ ] Test donor/partner dashboards
- [ ] Custom domain configured (optional)

---

**Your app is now live on Railway!** 🎉
