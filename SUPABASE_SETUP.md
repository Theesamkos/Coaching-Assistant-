# Supabase Migration Guide

## Overview

The Coaching Assistant application has been migrated from Firebase to Supabase. This document provides setup instructions and important notes about the migration.

## Required Environment Variables

Create a `.env` file in the root of the project with the following variables:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project dashboard under **Settings > API**.

## Database Setup

### 1. Run the Database Schema

Execute the SQL script in `supabase-schema.sql` in your Supabase SQL editor to create:

- The `profiles` table with proper structure
- Row Level Security (RLS) policies
- Automatic triggers for `updated_at` timestamp
- Optional trigger to auto-create profile entries

### 2. Configure Google OAuth (Optional)

If you want to use Google OAuth login:

1. Go to your Supabase dashboard
2. Navigate to **Authentication > Providers**
3. Enable **Google** provider
4. Add your Google OAuth credentials (Client ID and Client Secret)
5. Configure the redirect URL in your Google Cloud Console

## Key Changes from Firebase

### Authentication

- **Firebase Auth** → **Supabase Auth**
  - Session management is handled automatically
  - OAuth providers configured through Supabase dashboard
  - Password reset emails sent via Supabase

### Database

- **Firestore** → **PostgreSQL**
  - `users` collection → `profiles` table
  - Document-based → Relational data model
  - Real-time subscriptions available (not yet implemented)

### Code Changes

- Replaced `firebase` package with `@supabase/supabase-js`
- Updated all service methods to use Supabase client
- Changed auth state management to use Supabase sessions
- Updated user object structure to match Supabase User type

## Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Deployment

### Vercel

The `vercel.json` file has been updated with Supabase environment variables. You need to:

1. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

2. Deploy as usual:
   ```bash
   vercel deploy
   ```

## Testing Checklist

After setting up your Supabase project, test the following:

- [ ] User registration with email/password
- [ ] User registration with Google OAuth
- [ ] User login with email/password
- [ ] User login with Google OAuth
- [ ] Session persistence across page refreshes
- [ ] Password reset flow
- [ ] Profile setup after registration
- [ ] Profile update functionality
- [ ] Protected route access control
- [ ] Logout functionality

## Troubleshooting

### "Missing Supabase environment variables" error

Make sure you have created a `.env` file with the correct environment variables.

### Profile not found after registration

Check that the `on_auth_user_created` trigger is properly set up in your Supabase database. Alternatively, the profile will be created when the user completes the profile setup page.

### Google OAuth not working

1. Verify Google provider is enabled in Supabase dashboard
2. Check that Google OAuth credentials are correctly configured
3. Ensure redirect URLs are properly set in both Google Cloud Console and Supabase

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

