#!/bin/bash

# Node.js Installation Script
# This script helps you install Node.js via nvm (recommended)

# Don't exit on error - we want to handle errors gracefully
set +e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 Node.js Installation Script${NC}"
echo -e "${BLUE}This will install nvm (Node Version Manager) and Node.js${NC}"
echo ""

# Create .zshrc if it doesn't exist
if [ ! -f "$HOME/.zshrc" ]; then
    echo -e "${YELLOW}Creating ~/.zshrc file...${NC}"
    touch "$HOME/.zshrc"
    echo -e "${GREEN}✓ Created ~/.zshrc${NC}"
fi

# Check if nvm is already installed
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    echo -e "${GREEN}✓ nvm is already installed${NC}"
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
else
    echo -e "${YELLOW}Installing nvm...${NC}"
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    
    # Source nvm (don't fail if it doesn't work yet)
    export NVM_DIR="$HOME/.nvm"
    if [ -s "$NVM_DIR/nvm.sh" ]; then
        \. "$NVM_DIR/nvm.sh"
        echo -e "${GREEN}✓ nvm installed successfully${NC}"
    else
        echo -e "${YELLOW}⚠️  nvm installed but needs a terminal restart${NC}"
        echo "Please restart your terminal and run this script again, or run:"
        echo "  source ~/.zshrc"
        exit 1
    fi
fi

# Check if Node.js is already installed
if command -v node &> /dev/null && node --version &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js is already installed: $NODE_VERSION${NC}"
    echo ""
    read -p "Do you want to install/switch to the latest LTS version? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Installing latest LTS version of Node.js...${NC}"
        nvm install --lts
        nvm use --lts
        nvm alias default node
        echo -e "${GREEN}✓ Node.js LTS installed and set as default${NC}"
    fi
else
    echo -e "${YELLOW}Installing latest LTS version of Node.js...${NC}"
    nvm install --lts
    nvm use --lts
    nvm alias default node
    
    echo -e "${GREEN}✓ Node.js installed successfully${NC}"
fi

# Verify installation
echo ""
echo -e "${BLUE}Verifying installation...${NC}"

if command -v node &> /dev/null && command -v npm &> /dev/null; then
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    
    echo -e "${GREEN}✓ Node.js version: $NODE_VERSION${NC}"
    echo -e "${GREEN}✓ npm version: $NPM_VERSION${NC}"
    
    echo ""
    echo -e "${GREEN}🎉 Installation complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Navigate to your project: cd /Users/samorth/Desktop/coachingasst"
    echo "2. Run: ./start.sh"
    echo ""
else
    echo -e "${YELLOW}⚠️  Node.js or npm not found in PATH${NC}"
    echo ""
    echo "Please restart your terminal and run:"
    echo "  source ~/.zshrc"
    echo ""
    echo "Then verify with:"
    echo "  node --version"
    echo "  npm --version"
    echo ""
fi

