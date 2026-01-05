# Node.js Installation Guide

This guide will help you install Node.js on your macOS system. We recommend using **nvm (Node Version Manager)** as it allows you to easily switch between different Node.js versions for different projects.

## Option 1: Install via nvm (Recommended for Developers)

nvm allows you to install and manage multiple versions of Node.js, which is useful when working on different projects that may require different Node.js versions.

### Step 1: Install nvm

Open your terminal and run:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

### Step 2: Reload your shell configuration

After installation, reload your shell:

```bash
source ~/.zshrc
```

Or simply close and reopen your terminal.

### Step 3: Verify nvm is installed

```bash
nvm --version
```

You should see a version number (e.g., `0.39.7`).

### Step 4: Install the latest LTS (Long Term Support) version of Node.js

```bash
nvm install --lts
```

This installs the latest stable LTS version of Node.js.

### Step 5: Set it as your default version

```bash
nvm use --lts
nvm alias default node
```

### Step 6: Verify Node.js and npm are installed

```bash
node --version
npm --version
```

You should see version numbers for both.

## Option 2: Install via Official Installer (Simpler, but less flexible)

If you prefer a simpler installation without version management:

1. Visit https://nodejs.org/
2. Download the **LTS (Long Term Support)** version for macOS
3. Run the installer (.pkg file)
4. Follow the installation wizard
5. Restart your terminal
6. Verify installation:
   ```bash
   node --version
   npm --version
   ```

## Option 3: Install Homebrew first, then Node.js

Homebrew is a package manager for macOS that makes installing development tools easier.

### Step 1: Install Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Follow the prompts. You may be asked for your password.

### Step 2: Add Homebrew to your PATH (if needed)

After installation, Homebrew will show you commands to run. Typically:

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
eval "$(/opt/homebrew/bin/brew shellenv)"
```

### Step 3: Install Node.js via Homebrew

```bash
brew install node
```

### Step 4: Verify installation

```bash
node --version
npm --version
```

## After Installation

Once Node.js is installed, you can:

1. **Start your project:**
   ```bash
   cd /Users/samorth/Desktop/coachingasst
   ./start.sh
   ```

2. **Or manually:**
   ```bash
   npm install  # Install dependencies
   npm run dev  # Start development server
   ```

## Troubleshooting

### If commands still don't work after installation:

1. **Restart your terminal** - This reloads your PATH
2. **Check your shell configuration:**
   ```bash
   echo $PATH
   ```
   Make sure `/usr/local/bin` or `/opt/homebrew/bin` (for Apple Silicon) is in the PATH

3. **For nvm users:** Make sure these lines are in your `~/.zshrc`:
   ```bash
   export NVM_DIR="$HOME/.nvm"
   [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
   [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
   ```

## Which Option Should You Choose?

- **Option 1 (nvm)**: Best for developers who work on multiple projects
- **Option 2 (Official Installer)**: Simplest, good for beginners
- **Option 3 (Homebrew)**: Good if you plan to install other development tools

**We recommend Option 1 (nvm)** for flexibility and future projects.





