# Contributing to Coaching Assistant

Thank you for your interest in contributing to the Coaching Assistant project!

## Development Workflow

### Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/Theesamkos/Coaching-Assistant-.git
   cd Coaching-Assistant-
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Add your Supabase credentials
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

### Code Style

- **TypeScript**: Use strict typing, avoid `any`
- **Components**: Use functional components with hooks
- **Styling**: Use TailwindCSS utility classes
- **Icons**: Use Heroicons from `@heroicons/react`
- **Formatting**: Code is automatically formatted with Prettier

### Commit Messages

Follow conventional commits format:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**Examples:**
```
feat: Add player statistics dashboard
fix: Resolve calendar event overlap issue
docs: Update README with deployment instructions
```

### Testing

Before committing:

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Run linter**
   ```bash
   npm run lint
   ```

3. **Test locally**
   - Navigate through all pages
   - Test key features
   - Check mobile responsiveness

### Pull Request Process

1. Create a feature branch
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

3. Push to GitHub
   ```bash
   git push origin feature/your-feature-name
   ```

4. Open a Pull Request on GitHub

### Code Review

- All PRs require review before merging
- Address review comments promptly
- Keep PRs focused and reasonably sized

## Questions?

For questions or issues, please open a GitHub issue or contact the development team.

---

Happy coding! 🏒
