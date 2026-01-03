#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Coaching Assistant...${NC}"

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Try to load Node.js from common locations
setup_node_path() {
    # Try to source zshrc/bash_profile to get PATH
    if [ -f "$HOME/.zshrc" ]; then
        source "$HOME/.zshrc" 2>/dev/null
    fi
    if [ -f "$HOME/.bash_profile" ]; then
        source "$HOME/.bash_profile" 2>/dev/null
    fi
    if [ -f "$HOME/.profile" ]; then
        source "$HOME/.profile" 2>/dev/null
    fi
    
    # Try to load nvm if it exists
    export NVM_DIR="$HOME/.nvm"
    if [ -s "$NVM_DIR/nvm.sh" ]; then
        source "$NVM_DIR/nvm.sh" 2>/dev/null
        # Use default node version if nvm is available
        nvm use default 2>/dev/null || nvm use node 2>/dev/null || true
    fi
    
    # Check common installation paths and add to PATH if found
    COMMON_PATHS=(
        "/usr/local/bin"
        "/opt/homebrew/bin"
        "$HOME/.local/bin"
        "/opt/node/bin"
    )
    
    for path in "${COMMON_PATHS[@]}"; do
        if [ -d "$path" ] && [[ ":$PATH:" != *":$path:"* ]]; then
            export PATH="$path:$PATH"
        fi
    done
    
    # Try to find node directly in common locations
    if ! command -v node &> /dev/null; then
        for path in "${COMMON_PATHS[@]}"; do
            if [ -f "$path/node" ]; then
                export PATH="$path:$PATH"
                break
            fi
        done
    fi
}

# Setup Node.js path
echo -e "${BLUE}🔍 Looking for Node.js...${NC}"
setup_node_path

# Diagnostic: Check if node exists somewhere
if ! command -v node &> /dev/null; then
    echo -e "${BLUE}Checking common Node.js locations...${NC}"
    FOUND_NODE=""
    for path in /usr/local/bin/node /opt/homebrew/bin/node "$HOME/.nvm/versions/node"/*/bin/node /usr/bin/node; do
        if [ -f "$path" ] 2>/dev/null; then
            FOUND_NODE="$path"
            echo -e "${GREEN}✓ Found Node.js at: $path${NC}"
            # Add its directory to PATH
            export PATH="$(dirname "$path"):$PATH"
            break
        fi
    done
    
    # Check for node in any nvm version
    if [ -z "$FOUND_NODE" ] && [ -d "$HOME/.nvm/versions/node" ]; then
        LATEST_NODE=$(ls -t "$HOME/.nvm/versions/node" 2>/dev/null | head -1)
        if [ -n "$LATEST_NODE" ] && [ -f "$HOME/.nvm/versions/node/$LATEST_NODE/bin/node" ]; then
            FOUND_NODE="$HOME/.nvm/versions/node/$LATEST_NODE/bin/node"
            echo -e "${GREEN}✓ Found Node.js via nvm: $FOUND_NODE${NC}"
            export PATH="$(dirname "$FOUND_NODE"):$PATH"
        fi
    fi
fi

# Function to find package manager
find_package_manager() {
    # Check in order: pnpm, yarn, npm
    if command -v pnpm &> /dev/null; then
        echo "pnpm"
    elif command -v yarn &> /dev/null; then
        echo "yarn"
    elif command -v npm &> /dev/null; then
        echo "npm"
    else
        # Try direct paths
        for cmd in pnpm yarn npm; do
            for path in /usr/local/bin /opt/homebrew/bin "$HOME/.local/bin"; do
                if [ -f "$path/$cmd" ]; then
                    export PATH="$path:$PATH"
                    echo "$cmd"
                    return
                fi
            done
        done
        echo ""
    fi
}

# Function to check if node_modules exists
check_dependencies() {
    if [ ! -d "node_modules" ]; then
        return 1
    fi
    return 0
}

# Find available package manager
PM=$(find_package_manager)

if [ -z "$PM" ]; then
    echo -e "${YELLOW}❌ Error: No package manager found (npm, yarn, or pnpm)${NC}"
    echo ""
    echo "Node.js doesn't appear to be in your PATH. Here are some options:"
    echo ""
    echo "1. Install Node.js from https://nodejs.org/ (recommended)"
    echo "2. If you have Node.js installed via Homebrew, try:"
    echo "   brew install node"
    echo "3. If you're using nvm, make sure it's loaded in your ~/.zshrc:"
    echo "   export NVM_DIR=\"\$HOME/.nvm\""
    echo "   [ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\""
    echo ""
    echo "After installing, restart your terminal and try again."
    echo ""
    echo "Current PATH: $PATH"
    exit 1
fi

# Verify Node.js is available
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️  Warning: Node.js not found, but $PM is available${NC}"
    echo "This might cause issues. Please ensure Node.js is installed."
fi

echo -e "${GREEN}✓ Found package manager: $PM${NC}"

# Check if dependencies are installed
if ! check_dependencies; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    $PM install
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}❌ Failed to install dependencies${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi

# Start the dev server
echo -e "${GREEN}🌐 Starting development server...${NC}"
echo -e "${GREEN}The app will be available at http://localhost:5173${NC}"
echo ""

$PM run dev

