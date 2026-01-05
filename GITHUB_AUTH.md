# GitHub Authentication Setup

You need to authenticate with GitHub to push code. Here are two options:

## Option 1: Personal Access Token (Quick & Easy) ⚡

### Step 1: Create a Personal Access Token

1. Go to GitHub.com and sign in
2. Click your profile picture (top right) → **Settings**
3. Scroll down to **Developer settings** (bottom left)
4. Click **Personal access tokens** → **Tokens (classic)**
5. Click **Generate new token** → **Generate new token (classic)**
6. Give it a name: `Coaching Assistant`
7. Select expiration: Choose how long you want it to last (90 days, 1 year, etc.)
8. Check the **`repo`** scope (this gives full repository access)
9. Click **Generate token** at the bottom
10. **IMPORTANT**: Copy the token immediately (you won't see it again!)

### Step 2: Use the Token to Push

When you run `git push`, use the token as your password:

```bash
git push origin main
```

When prompted:
- **Username**: Your GitHub username
- **Password**: Paste your Personal Access Token (not your GitHub password)

### Step 3: (Optional) Save Credentials

To avoid entering credentials every time:

**macOS:**
```bash
git config --global credential.helper osxkeychain
```

Then push again - it will save your credentials in Keychain.

---

## Option 2: SSH Keys (Recommended for Long-term) 🔐

### Step 1: Check for Existing SSH Key

```bash
ls -al ~/.ssh
```

Look for files named `id_rsa.pub` or `id_ed25519.pub`

### Step 2: Generate SSH Key (if you don't have one)

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

- Press Enter to accept default file location
- Enter a passphrase (optional but recommended)
- Press Enter again to confirm

### Step 3: Add SSH Key to SSH Agent

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

### Step 4: Copy Your Public Key

```bash
cat ~/.ssh/id_ed25519.pub
```

Copy the entire output (starts with `ssh-ed25519`)

### Step 5: Add Key to GitHub

1. Go to GitHub.com → **Settings** → **SSH and GPG keys**
2. Click **New SSH key**
3. Title: `MacBook Pro` (or any name)
4. Key: Paste your public key
5. Click **Add SSH key**

### Step 6: Change Remote URL to SSH

```bash
cd /Users/samorth/Desktop/coachingasst
git remote set-url origin git@github.com:Theesamkos/Coaching-Assistant-.git
```

### Step 7: Test Connection

```bash
ssh -T git@github.com
```

You should see: `Hi Theesamkos! You've successfully authenticated...`

### Step 8: Push

```bash
git push origin main
```

---

## Quick Fix: Use Token Right Now

If you just want to push now without setting up SSH:

1. Create a token (follow Option 1, Step 1)
2. Run:
   ```bash
   git push origin main
   ```
3. When asked for password, paste your token

---

## Troubleshooting

**"Permission denied" error:**
- Make sure you selected the `repo` scope when creating the token
- For SSH: Make sure you added the public key (`.pub` file) to GitHub, not the private key

**"Authentication failed":**
- Double-check your username
- Make sure you're using the token, not your GitHub password
- Try generating a new token

**Want to switch between HTTPS and SSH?**
- Check current: `git remote -v`
- Switch to SSH: `git remote set-url origin git@github.com:Theesamkos/Coaching-Assistant-.git`
- Switch to HTTPS: `git remote set-url origin https://github.com/Theesamkos/Coaching-Assistant-.git`



