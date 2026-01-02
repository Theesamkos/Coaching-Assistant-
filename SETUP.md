# Phase 1 Setup Guide

## ✅ Completed Setup

Phase 1 foundation has been set up with the following:

### Project Structure
- ✅ React + Vite + TypeScript project initialized
- ✅ Tailwind CSS configured with shadcn/ui setup
- ✅ Folder structure created (components, pages, hooks, utils, services, store, types, config)
- ✅ Core dependencies installed (Firebase, React Router, date-fns, Zustand, react-hook-form, Vitest)

### Authentication System
- ✅ Firebase Auth service layer (`auth.service.ts`)
- ✅ User service layer (`user.service.ts`)
- ✅ Zustand auth store (`authStore.ts`)
- ✅ Auth context provider (`AuthContext.tsx`)
- ✅ Custom `useAuth` hook
- ✅ Login page with email/password and Google OAuth
- ✅ Register page with role selection
- ✅ Profile setup page
- ✅ Forgot password page
- ✅ Protected routes component

### Firebase Configuration
- ✅ Firebase config file structure (`config/firebase.ts`)
- ✅ Firestore security rules (`firestore.rules`)
- ✅ Storage security rules (`storage.rules`)
- ✅ Firestore indexes configuration (`firestore.indexes.json`)
- ✅ Firebase functions configuration (`firebase.json`)

### Routing
- ✅ React Router setup with protected routes
- ✅ Role-based routing structure
- ✅ Navigation guards

## 🔧 Next Steps - Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `coachingasst` (or your preferred name)
4. Disable Google Analytics (optional for MVP)
5. Click "Create project"

### 2. Enable Authentication

1. In Firebase Console, go to **Authentication** > **Get started**
2. Enable **Email/Password** provider
3. Enable **Google** provider:
   - Add your project's support email
   - Save the OAuth consent screen settings

### 3. Create Firestore Database

1. Go to **Firestore Database** > **Create database**
2. Start in **test mode** (we have security rules configured)
3. Choose a location (choose closest to your users)
4. Click **Enable**

### 4. Enable Storage

1. Go to **Storage** > **Get started**
2. Start in **test mode** (we have security rules configured)
3. Use the same location as Firestore
4. Click **Done**

### 5. Get Firebase Configuration

1. Go to **Project Settings** (gear icon) > **General**
2. Scroll to "Your apps" section
3. Click the **Web** icon (`</>`)
4. Register app with nickname: "Web App"
5. Copy the `firebaseConfig` object values

### 6. Set Environment Variables

Create `.env.local` file in the project root:

```bash
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 7. Deploy Security Rules

Install Firebase CLI (if not already installed):
```bash
pnpm add -g firebase-tools
# or
npm install -g firebase-tools
```

Login to Firebase:
```bash
firebase login
```

Initialize Firebase in your project:
```bash
firebase init
```
- Select: Firestore, Storage, Functions
- Use existing project
- Select your project
- Use default file names
- Install dependencies: Yes

Deploy rules:
```bash
firebase deploy --only firestore:rules,storage:rules
```

## 🚀 Running the Application

1. Install dependencies (using pnpm):
```bash
pnpm install
```

**Note**: This project uses `pnpm`. If you don't have it installed:
```bash
npm install -g pnpm
```

2. Start development server:
```bash
npm run dev
```

3. Open browser to `http://localhost:3000`

## 📝 Remaining Phase 1 Tasks

### 1.5 Invitation System
- [ ] Create invitation data model
- [ ] Build Cloud Functions for invitations
- [ ] Build invitation UI for coaches
- [ ] Build invitation acceptance flow

### 1.6 Routing and Navigation
- [ ] Create layout components (AppLayout, Header, Sidebar)
- [ ] Add user profile dropdown
- [ ] Implement logout functionality
- [ ] Make responsive for mobile/tablet

### 1.7 Deployment Setup
- [ ] Set up Vercel project
- [ ] Configure build settings
- [ ] Add environment variables
- [ ] Deploy initial version

## 🧪 Testing

Run tests:
```bash
npm run test
```

Run tests with UI:
```bash
npm run test:ui
```

## 📦 Key Dependencies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Firebase** - Backend (Auth, Firestore, Storage)
- **React Router** - Navigation
- **Zustand** - State management
- **date-fns** - Date utilities
- **react-hook-form** - Form handling
- **Vitest** - Testing framework

## 🔐 Security Notes

- Security rules are configured but need to be deployed
- Environment variables should never be committed to git
- `.env.local` is in `.gitignore`
- Production Firebase project should be separate from development

## 📚 Documentation

- See `docs/tasks.md` for complete task list
- See `docs/architecture.md` for system architecture
- See `README.md` for general project info

