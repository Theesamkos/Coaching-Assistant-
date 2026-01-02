# Project Decisions & Preferences

This document captures key decisions made during project setup to maintain consistency throughout development.

## Technology Stack

- **Language**: TypeScript
- **Framework**: React 18 + Vite
- **State Management**: Zustand
- **Date Library**: date-fns
- **UI Components**: shadcn/ui (install as needed)
- **Testing**: Vitest
- **Package Manager**: pnpm
- **Styling**: Tailwind CSS with default shadcn/ui styling

## Project Structure

- Use standard, conventional folder structure
- Only introduce new folders when there's a clear need
- Keep it simple and boring for now

## Firebase Configuration

- **Environment**: Production
- **Cloud Functions**: Node.js 20
- **Email Service**: Firebase Email Extension (for MVP)
  - Can migrate to SendGrid later if needed
- **Invitation Expiration**: 7 days (reasonable default, can be configured)

## Platform Strategy

- **MVP**: Web application only
- **Mobile App**: Version 2 (not in MVP scope)

## Deployment

- **Platform**: Vercel
- **Status**: Configuration prepared, account connection pending
- **Domain**: Default Vercel domain for MVP
- **Custom Domain**: Not in MVP scope

## Development Workflow

- **API Keys**: `.env.local` for local dev, `.env.example` committed
- **Code Style**: Default ESLint and Prettier configuration
- **Stricter Rules**: Can be added later if needed

## Development Philosophy

1. **Prioritize simplicity and clarity** over premature optimization
2. **Favor well-documented, readable code** that's easy to reason about
3. **Keep dependencies minimal** unless they provide clear leverage
4. **Use AI-assisted development** where helpful, but avoid abstractions that reduce debuggability
5. **Prefer incremental, testable progress** over large refactors
6. **Optimize for learning and maintainability** in the MVP phase

## Code Quality Principles

- Readable > Clever
- Documented > Self-explanatory (when in doubt, document)
- Simple > Complex
- Maintainable > Optimized (for MVP)
- Testable > Perfect

