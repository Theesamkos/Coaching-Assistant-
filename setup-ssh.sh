#!/bin/bash

# SSH Key Setup Script for GitHub

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔐 Setting up SSH for GitHub...${NC}"
echo ""

# Check if SSH key already exists
if [ -f ~/.ssh/id_ed25519 ] || [ -f ~/.ssh/id_rsa ]; then
    echo -e "${YELLOW}SSH key already exists.${NC}"
    if [ -f ~/.ssh/id_ed25519.pub ]; then
        KEY_FILE=~/.ssh/id_ed25519.pub
    else
        KEY_FILE=~/.ssh/id_rsa.pub
    fi
else
    echo -e "${YELLOW}Generating new SSH key...${NC}"
    echo "Enter your email (or press Enter for default):"
    read -r EMAIL
    
    if [ -z "$EMAIL" ]; then
        EMAIL="your_email@example.com"
    fi
    
    ssh-keygen -t ed25519 -C "$EMAIL" -f ~/.ssh/id_ed25519 -N ""
    KEY_FILE=~/.ssh/id_ed25519.pub
    echo -e "${GREEN}✓ SSH key generated${NC}"
fi

# Start ssh-agent
eval "$(ssh-agent -s)" > /dev/null 2>&1

# Add key to ssh-agent
if [ -f ~/.ssh/id_ed25519 ]; then
    ssh-add ~/.ssh/id_ed25519 2>/dev/null
else
    ssh-add ~/.ssh/id_rsa 2>/dev/null
fi

echo ""
echo -e "${GREEN}✓ SSH key ready${NC}"
echo ""
echo -e "${YELLOW}📋 Your public key (copy this):${NC}"
echo ""
cat "$KEY_FILE"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Copy the key above (starts with ssh-ed25519 or ssh-rsa)"
echo "2. Go to: https://github.com/settings/keys"
echo "3. Click 'New SSH key'"
echo "4. Paste the key and save"
echo "5. Then run: git remote set-url origin git@github.com:Theesamkos/Coaching-Assistant-.git"
echo "6. Then run: git push --force origin main"
echo ""



