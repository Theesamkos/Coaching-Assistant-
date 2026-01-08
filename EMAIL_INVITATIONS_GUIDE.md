# Email Invitations for Non-Registered Users

## 🎯 Overview

You can now invite players who haven't signed up yet! When they click the invitation link, they'll be prompted to create an account or sign in, and the invitation will automatically be linked to their profile.

## 📋 What Was Changed

### 1. **Database Schema Updates** (`enable-email-invitations.sql`)
- ✅ Made `player_id` **nullable** in `coach_players` table
- ✅ Added `player_email` column (required) to store invited email
- ✅ Added `expires_at` column for invitation expiration (30 days)
- ✅ Updated unique constraint: `coach_id + player_email` (instead of `coach_id + player_id`)
- ✅ Added automatic linking: when a user signs up, any pending invitations to their email are automatically linked

### 2. **Service Layer Updates**
- ✅ Updated `playerService.invitePlayer()` to accept email addresses even if user doesn't exist
- ✅ Invitations now work for both registered and non-registered users
- ✅ Added proper validation and error messages

### 3. **Type Updates**
- ✅ Updated `CoachPlayer` interface to include:
  - `playerEmail: string` - Email of invited player
  - `expiresAt: Date | null` - Invitation expiration
  - `playerId: string | null` - Now nullable

### 4. **New Invitation Acceptance Page**
- ✅ Created `/invite/:token` route
- ✅ Smart routing:
  - **Not logged in?** → Shows sign in/sign up options
  - **Logged in as player?** → Auto-accepts if email matches
  - **Wrong email?** → Shows helpful error message
- ✅ Beautiful UI with success/error states

## 🚀 How to Enable This Feature

### Step 1: Run the Database Migration

1. Open your **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the contents of `enable-email-invitations.sql`
3. Click **Run** to execute the migration
4. Verify the changes with the verification queries at the bottom

### Step 2: Test the Flow

1. **Refresh your browser** (the dev server should have already reloaded)
2. Go to `/coach/players` → Click "Invite Player"
3. Enter an email address (even one that doesn't exist in your system)
4. Copy the invitation link
5. Open it in an incognito/private window
6. You should see the invitation page with sign in/sign up options!

## 📖 How It Works

### For Coaches:
1. Enter any email address (registered or not)
2. System generates invitation link
3. Share the link via email, text, etc.
4. Track invitation status in Players list

### For Players (Not Registered):
1. Click invitation link → Sees beautiful invitation page
2. Click "Create Account" → Redirected to registration with email pre-filled
3. After signing up, invitation automatically links to their account
4. Redirected to dashboard with access to coach's content

### For Players (Already Registered):
1. Click invitation link → Prompted to sign in
2. Sign in → Invitation automatically accepted
3. Redirected to dashboard

## 🔐 Security Features

- ✅ Invitations expire after 30 days
- ✅ Email validation: Only the invited email can accept
- ✅ Status tracking: pending/accepted/declined
- ✅ One invitation per coach-email combination
- ✅ Row Level Security (RLS) policies protect data

## 🎨 UI Features

### Invitation Page Shows:
- Coach's name who sent the invitation
- Clear call-to-action buttons
- Expired invitation warnings
- Already accepted notifications
- Email mismatch warnings

### Coach's Invite Page Shows:
- Success message with copyable link
- List of pending invitations
- Ability to cancel invitations
- Clear status indicators

## 📝 Database Trigger Explained

When a new player signs up, a database trigger automatically:
1. Finds any pending invitations sent to their email
2. Links those invitations to their new player_id
3. Updates the relationship status

This means **zero manual intervention** required!

## 🧪 Testing Checklist

- [ ] Send invitation to non-existent email
- [ ] Copy invitation link
- [ ] Open in incognito window
- [ ] Click "Create Account"
- [ ] Verify email is pre-filled
- [ ] Complete registration
- [ ] Verify invitation is accepted
- [ ] Check coach's player list shows new player
- [ ] Test expired invitation (manually set expires_at in database)
- [ ] Test invitation with mismatched email

## 🐛 Troubleshooting

### "No user found with that email"
- **Old behavior:** This error means you need to run the migration
- **New behavior:** Should work regardless of whether user exists

### Invitation link doesn't work
- Check URL format: `http://localhost:3000/invite/{TOKEN}`
- Verify token exists in database
- Check if invitation has expired

### Email mismatch error
- Player must sign in with the email address the invitation was sent to
- They can create a new account with that email if needed

## 🎯 Next Steps

1. **Run the migration** (`enable-email-invitations.sql`)
2. **Test the flow** with a real email address
3. **Consider adding email sending** (e.g., SendGrid, Mailgun) to automatically email the invitation link
4. **Add invitation reminders** for coaches (show "Invite sent X days ago")

## 💡 Future Enhancements

- Send invitation emails automatically
- Resend invitation links
- Bulk invite multiple players at once
- Custom invitation messages from coaches
- Invitation templates
- SMS invitations

---

**Ready to test!** Run the migration and try inviting someone who hasn't signed up yet! 🚀

