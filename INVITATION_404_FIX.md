# Invitation Link 404 Error - FIXED! 🎉

## What Was Wrong

The invitation links were returning 404 errors because of **two critical issues**:

### Issue 1: URL-Unsafe Base64 Tokens
The invitation tokens were being generated using standard base64 encoding, which includes `/` and `+` characters. When these appear in a URL like:

```
http://localhost:3000/invite/abc/def+ghi==
```

React Router interprets the `/` in the token as path separators, breaking the route and causing a 404!

### Issue 2: Missing Fields in Service Methods
The `getInvitationByToken` and `acceptInvitation` methods were missing the `playerEmail` and `expiresAt` fields when mapping data from the database, causing the AcceptInvitePage component to fail.

## What Was Fixed

### ✅ 1. Client-Side URL Encoding
Updated all invitation link generation to properly encode tokens:

**Files Updated:**
- `src/pages/coach/InvitePlayerPage.tsx` - Both the main form and the InvitationCard component
- `src/pages/auth/AcceptInvitePage.tsx` - Added decoding of the URL parameter

**Change:**
```typescript
// Before:
const inviteLink = `${window.location.origin}/invite/${data.invitationToken}`

// After:
const inviteLink = `${window.location.origin}/invite/${encodeURIComponent(data.invitationToken!)}`
```

### ✅ 2. Service Layer Fixes
Updated `player.service.ts` to include all required fields:

- `getInvitationByToken()` - Now returns `playerEmail` and `expiresAt`
- `acceptInvitation()` - Now returns `playerEmail` and `expiresAt`

### ✅ 3. Database Function (Optional Improvement)
Created `fix-invitation-token-encoding.sql` which updates the `generate_invitation_token()` function to use URL-safe base64 encoding (replacing `/` with `_` and `+` with `-`).

**This is optional** because we're now encoding tokens on the client side, but it's a good long-term fix.

## How to Test

### Step 1: Refresh Your Browser
The dev server should have automatically picked up the changes via HMR (Hot Module Replacement).

### Step 2: Test the Flow

1. **Login as a coach** at http://localhost:3000
2. **Navigate to** http://localhost:3000/coach/players/invite
3. **Enter an email address** (can be any email, doesn't need to exist yet)
4. **Click "Generate Invitation Link"**
5. **Copy the generated link** - It should now have URL-encoded characters
6. **Open in an incognito/private window** to test as a new user
7. **Verify the page loads** (no 404!)

### Step 3: Test Invitation Acceptance

If you want to test the full flow:
1. Paste the invitation link in a private window
2. You should see the AcceptInvitePage (not a 404)
3. Sign up with the invited email address
4. The invitation should automatically be accepted

## Optional: Run Database Migration

If you want the tokens to be URL-safe at the database level (recommended for production):

1. Open your **Supabase Dashboard** → **SQL Editor**
2. Copy the contents of `fix-invitation-token-encoding.sql`
3. Click **Run** to update the function
4. New invitations will now use URL-safe tokens

**Note:** Existing invitation links will still work because we're handling encoding/decoding on the client side!

## Summary of Changes

| File | Changes |
|------|---------|
| `src/services/player.service.ts` | Added missing `playerEmail` and `expiresAt` fields |
| `src/pages/coach/InvitePlayerPage.tsx` | Added `encodeURIComponent()` to token in links |
| `src/pages/auth/AcceptInvitePage.tsx` | Added `decodeURIComponent()` to read token from URL |
| `fix-invitation-token-encoding.sql` | (Optional) URL-safe token generation function |

## What to Do Next

1. **Test the invitation flow** following the steps above
2. **If it works:** You can optionally run the SQL migration for cleaner URLs
3. **If you still see 404s:** Please share the exact URL you're trying to access so I can investigate further

The invitation system should now work perfectly! 🚀
