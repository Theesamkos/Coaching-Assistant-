# Deployment Guide

## Vercel Deployment

This project is configured for deployment on Vercel. The configuration is ready, but you'll need to connect your Vercel account when ready to deploy.

### Prerequisites

1. Vercel account (create at [vercel.com](https://vercel.com))
2. Firebase project configured (see `SETUP.md`)
3. Environment variables set up

### Deployment Steps

1. **Connect to Vercel**:
   ```bash
   pnpm add -g vercel
   vercel login
   ```

2. **Deploy**:
   ```bash
   vercel
   ```
   
   Or connect via GitHub:
   - Push your code to GitHub
   - Import project in Vercel dashboard
   - Vercel will auto-detect the Vite configuration

3. **Set Environment Variables in Vercel**:
   - Go to Project Settings > Environment Variables
   - Add all Firebase config variables:
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_STORAGE_BUCKET`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - `VITE_FIREBASE_APP_ID`

4. **Configure Build Settings**:
   - Framework Preset: Vite
   - Build Command: `pnpm run build`
   - Output Directory: `dist`
   - Install Command: `pnpm install`

5. **Deploy**:
   - Vercel will automatically deploy on every push to main branch
   - Or trigger manual deployment from dashboard

### Custom Domain (Future)

When ready to add a custom domain:
1. Go to Project Settings > Domains
2. Add your domain
3. Follow DNS configuration instructions

### Environment Variables

For production, ensure all environment variables are set in Vercel dashboard. Never commit `.env.local` to git.

### Firebase Security Rules

Don't forget to deploy Firebase security rules:
```bash
firebase deploy --only firestore:rules,storage:rules
```



