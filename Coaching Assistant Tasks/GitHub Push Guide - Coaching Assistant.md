# GitHub Push Guide - Coaching Assistant

## 🚀 How to Push All Changes to GitHub

### Option 1: Push Everything at Once (Recommended)

```bash
# Navigate to your project directory
cd /path/to/Coaching-Assistant-

# Stage all new and modified files
git add .

# Commit with a descriptive message
git commit -m "feat: Complete Supabase migration with all features

- Migrated from Firebase to Supabase
- Added 12 database tables with RLS policies
- Created 7 service layers (player, drill, practice, progress, AI, activity, goal)
- Built 6 UI components (dashboards, drill library, session form, AI chat, progress tracker)
- Added comprehensive TypeScript types
- Implemented authentication with Supabase
- Added migration guides and documentation"

# Push to GitHub
git push origin main
```

### Option 2: Push in Stages

If you prefer to review changes before pushing:

```bash
# Check what files have changed
git status

# Review specific changes
git diff src/services/

# Stage specific directories
git add src/config/
git add src/types/
git add src/services/
git add src/pages/
git add src/components/
git add migrations/
git add *.md

# Commit
git commit -m "feat: Supabase migration and new features"

# Push
git push origin main
```

### Option 3: Create a New Branch (Best Practice)

```bash
# Create and switch to a new branch
git checkout -b feature/supabase-migration

# Stage all changes
git add .

# Commit
git commit -m "feat: Complete Supabase migration with all features"

# Push to new branch
git push origin feature/supabase-migration

# Then create a Pull Request on GitHub to merge into main
```

---

## 📋 Pre-Push Checklist

Before pushing, make sure:

- [ ] All files are saved
- [ ] `.env.local` is in `.gitignore` (don't commit secrets!)
- [ ] `node_modules/` is in `.gitignore`
- [ ] Build is successful: `npm run build` or `pnpm build`
- [ ] No TypeScript errors: `npm run type-check` (if available)
- [ ] Code is formatted: `npm run format` (if available)

---

## 🔒 Security Check

**IMPORTANT:** Never commit these files:

```bash
# Add to .gitignore if not already there
echo ".env.local" >> .gitignore
echo ".env" >> .gitignore
echo "node_modules/" >> .gitignore
echo "dist/" >> .gitignore
```

Verify secrets are not staged:

```bash
# Check staged files
git diff --cached

# If .env.local is staged, unstage it:
git reset HEAD .env.local
```

---

## 🌿 Branch Strategy

### Main Branch
- Keep stable, production-ready code
- Merge only tested features

### Feature Branches
- Create for each major feature
- Name format: `feature/description`
- Example: `feature/supabase-migration`

### Workflow
```bash
# Start new feature
git checkout -b feature/new-feature

# Work on feature
git add .
git commit -m "feat: description"

# Push feature branch
git push origin feature/new-feature

# Create Pull Request on GitHub
# After review, merge to main
```

---

## 🔄 Syncing with Remote

If others are working on the project:

```bash
# Before starting work
git pull origin main

# After pulling, resolve any conflicts
# Then continue with your changes
```

---

## 📝 Commit Message Guidelines

Use conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Formatting, missing semicolons, etc.
- `refactor:` - Code restructuring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

Examples:
```bash
git commit -m "feat: add AI chat component"
git commit -m "fix: resolve drill filtering bug"
git commit -m "docs: update migration guide"
```

---

## 🐛 Troubleshooting

### Issue: "fatal: remote origin already exists"
```bash
# Check current remote
git remote -v

# If wrong, update it
git remote set-url origin https://github.com/Theesamkos/Coaching-Assistant-.git
```

### Issue: "Updates were rejected"
```bash
# Pull latest changes first
git pull origin main --rebase

# Then push
git push origin main
```

### Issue: Merge conflicts
```bash
# Pull with rebase
git pull origin main --rebase

# Fix conflicts in files
# Then continue
git add .
git rebase --continue

# Push
git push origin main
```

---

## ✅ Verification

After pushing, verify on GitHub:

1. Go to https://github.com/Theesamkos/Coaching-Assistant-
2. Check that all files are present
3. Review the commit history
4. Ensure no secrets were committed

---

## 🎉 You're Done!

Your Supabase migration is now on GitHub and ready to:
- Share with team members
- Deploy to production
- Continue development

---

**Need help?** Check GitHub's documentation: https://docs.github.com/en/get-started
