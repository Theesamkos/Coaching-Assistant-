# Fix for User Registration 500 Error

## Problem Identified ✅

The user registration was failing with a **500 Internal Server Error** because the database trigger `on_auth_user_created` was trying to automatically create a profile without the required `role` field (which is NOT NULL).

## Solution

The fix involves removing the problematic trigger and letting the application handle profile creation (which already works correctly).

---

## Step-by-Step Fix Instructions

### Step 1: Run the Fix SQL Script

1. **Open your Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open the SQL Editor**
   - Click on **SQL Editor** in the left sidebar
   - Click **New Query**

3. **Copy and paste this SQL:**

```sql
-- Drop the trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function
DROP FUNCTION IF EXISTS public.handle_new_user();
```

4. **Click "Run"** to execute the script

5. **Verify Success**
   - You should see a message like "Success. No rows returned"
   - This confirms the trigger has been removed

### Step 2: Test User Registration

1. **Go back to your app** (http://localhost:3000)
2. **Try registering a new user:**
   - Fill in display name, email, password
   - Select role (coach or player)
   - Click "Create account"

3. **Expected Flow:**
   - ✅ Registration should succeed
   - ✅ You'll be redirected to `/profile-setup`
   - ✅ Complete your profile with role-specific information
   - ✅ You'll be redirected to `/dashboard`

### Step 3: Verify It's Working

After completing profile setup, check in Supabase:
1. Go to **Authentication** → **Users**
   - You should see your new user
2. Go to **Table Editor** → **profiles**
   - You should see your profile with all fields filled

---

## Why This Fix Works

### The Problem:
The trigger tried to create a profile immediately when a user signed up, but:
- It didn't know what `role` to assign (coach or player)
- The `role` field is required (NOT NULL)
- This caused the entire signup to fail with a 500 error

### The Solution:
Let the application handle profile creation in two steps:
1. **Sign up** → Creates user in `auth.users` only
2. **Profile Setup** → User completes their profile with role

This approach:
- ✅ Allows users to choose their role
- ✅ Collects role-specific data (organization/position)
- ✅ Respects RLS policies (users can INSERT their own profile)
- ✅ Provides better UX with the ProfileSetupPage

---

## What Was Changed

### Files Created:
- `supabase-fix-registration.sql` - SQL script to drop the trigger

### Files Updated:
- `supabase-schema.sql` - Removed the problematic trigger creation

### Files Unchanged:
- All application code remains the same
- RLS policies remain intact
- Profile creation logic in the app works perfectly

---

## Troubleshooting

### Still getting 500 error?
- Make sure you ran the fix SQL in Supabase
- Try registering with a different email
- Check the Supabase logs: Dashboard → Logs → API

### Can't see the fix SQL script?
- It's saved as `supabase-fix-registration.sql` in your project root
- The SQL is also shown above in Step 1

### Profile not being created?
- Make sure you complete the profile setup page
- Check browser console for errors
- Verify RLS policies are enabled on the profiles table

---

## Summary

**What to do now:**
1. Run the fix SQL in your Supabase SQL Editor (see Step 1 above)
2. Test registration again
3. Complete the profile setup
4. You're good to go! ✅

The fix is simple and safe - it just removes the problematic auto-creation trigger.

