# Hockey Coach Assistant MVP

A React + TypeScript application for managing hockey coaching workflows, drill assignments, and player progress tracking.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Routing**: React Router DOM
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Date Handling**: date-fns
- **Forms**: react-hook-form
- **Testing**: Vitest

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase account and project

### Installation

1. Install dependencies (using pnpm):
```bash
pnpm install
```

**Note**: This project uses `pnpm` as the package manager. If you don't have pnpm installed:
```bash
npm install -g pnpm
```

2. Set up Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password and Google)
   - Enable Firestore Database
   - Enable Storage
   - Copy your Firebase config

3. Create environment file:
```bash
cp .env.local.example .env.local
```

4. Add your Firebase configuration to `.env.local`

5. Start development server:
```bash
npm run dev
```

## Project Structure

```
src/
├── components/       # Reusable UI components
├── contexts/        # React contexts
├── hooks/          # Custom React hooks
├── pages/          # Page components
├── routes/         # Route configuration
├── services/       # API/service layer
├── store/          # Zustand stores
├── types/          # TypeScript type definitions
├── lib/            # Utility functions
└── config/         # Configuration files
```

## Development

- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run preview` - Preview production build
- `pnpm run test` - Run tests
- `pnpm run lint` - Run ESLint
- `pnpm run format` - Format code with Prettier
- `pnpm run format:check` - Check code formatting

## Firebase Setup

1. Create a new Firebase project
2. Enable Authentication:
   - Email/Password provider
   - Google provider
3. Create Firestore database (start in test mode for development)
4. Enable Storage
5. Copy config values to `.env.local`

## Next Steps

See `docs/tasks.md` for the complete development roadmap. Phase 1 includes:
- ✅ Project setup
- ✅ Authentication system
- ✅ User profile setup
- ⏳ Invitation system
- ⏳ Routing and navigation
- ⏳ Deployment setup

