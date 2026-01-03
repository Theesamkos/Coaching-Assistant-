# Firebase Setup Guide

## Quick Setup Steps

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `coachingasst` (or your preferred name)
4. Disable Google Analytics (optional for MVP)
5. Click **"Create project"**

### 2. Enable Authentication

1. In Firebase Console, click **"Authentication"** in the left sidebar
2. Click **"Get started"**
3. Go to the **"Sign-in method"** tab
4. Enable **Email/Password** provider:
   - Click on "Email/Password"
   - Toggle "Enable" to ON
   - Click "Save"
5. Enable **Google** provider:
   - Click on "Google"
   - Toggle "Enable" to ON
   - Add your project's support email
   - Click "Save"

### 3. Create Firestore Database

1. Click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Select **"Start in test mode"** (we have security rules configured)
4. Choose a location (choose closest to your users)
5. Click **"Enable"**

### 4. Enable Storage

1. Click **"Storage"** in the left sidebar
2. Click **"Get started"**
3. Select **"Start in test mode"** (we have security rules configured)
4. Use the same location as Firestore
5. Click **"Done"**

### 5. Get Firebase Configuration

1. Click the **gear icon** (⚙️) next to "Project Overview"
2. Select **"Project settings"**
3. Scroll down to the **"Your apps"** section
4. Click the **Web icon** (`</>`)
5. Register app with nickname: **"Web App"**
6. You'll see a `firebaseConfig` object - copy these values

### 6. Create .env.local File

In your project root (`/Users/samorth/Desktop/coachingasst`), create a file named `.env.local`:

```bash
cd /Users/samorth/Desktop/coachingasst
touch .env.local
```

Then open `.env.local` in your editor and add:

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

Replace the placeholder values with your actual Firebase config values from Step 5.

**Example:**
```env
VITE_FIREBASE_API_KEY=AIzaSyC1234567890abcdefghijklmnopqrstuvw
VITE_FIREBASE_AUTH_DOMAIN=coachingasst.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=coachingasst
VITE_FIREBASE_STORAGE_BUCKET=coachingasst.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

### 7. Restart Development Server

After creating `.env.local`:

1. Stop the current dev server (Ctrl+C in terminal)
2. Restart it:
   ```bash
   ./start.sh
   ```

The Firebase error should be gone, and you'll be able to use the login/register features!

## Troubleshooting

- **Still seeing errors?** Make sure `.env.local` is in the project root (same folder as `package.json`)
- **Variables not loading?** Restart the dev server after creating `.env.local`
- **Authentication not working?** Make sure Email/Password and Google providers are enabled in Firebase Console


