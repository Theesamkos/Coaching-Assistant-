#!/bin/bash

# Script to force git push with credential prompt

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Pushing to GitHub...${NC}"
echo ""

# Get to project directory
cd "$(dirname "$0")"

# Check if we have commits to push
AHEAD=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo "0")
if [ "$AHEAD" = "0" ]; then
    echo -e "${YELLOW}No commits to push.${NC}"
    exit 0
fi

echo -e "${GREEN}You have $AHEAD commit(s) to push${NC}"
echo ""

# Method 1: Try with GIT_TERMINAL_PROMPT
echo -e "${BLUE}Attempting push with credential prompt...${NC}"
echo -e "${YELLOW}If it hangs, press Ctrl+C and we'll try another method${NC}"
echo ""

# Temporarily disable credential helper to force prompt
export GIT_TERMINAL_PROMPT=1
export GIT_ASKPASS=""
unset SSH_ASKPASS

# Try push with timeout
timeout 15 git -c credential.helper= push --force origin main 2>&1

EXIT_CODE=$?

if [ $EXIT_CODE -eq 124 ]; then
    echo ""
    echo -e "${RED}Push timed out - git is waiting for credentials but not showing prompt${NC}"
    echo ""
    echo -e "${YELLOW}Let's try clearing the keychain entry and using token directly:${NC}"
    echo ""
    echo "1. Open Keychain Access (search in Spotlight)"
    echo "2. Search for 'github.com'"
    echo "3. Delete any entries you find"
    echo "4. Then run this script again, OR"
    echo ""
    echo -e "${BLUE}Alternative: Use token in URL (replace YOUR_TOKEN):${NC}"
    echo "git push --force https://Theesamkos:YOUR_TOKEN@github.com/Theesamkos/Coaching-Assistant-.git main"
    exit 1
elif [ $EXIT_CODE -ne 0 ]; then
    echo ""
    echo -e "${RED}Push failed with error code: $EXIT_CODE${NC}"
    echo ""
    echo -e "${YELLOW}Trying alternative method with token prompt...${NC}"
    echo ""
    echo "Enter your GitHub Personal Access Token:"
    read -s TOKEN
    echo ""
    
    if [ -z "$TOKEN" ]; then
        echo -e "${RED}No token provided. Exiting.${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}Pushing with token...${NC}"
    git push --force https://Theesamkos:$TOKEN@github.com/Theesamkos/Coaching-Assistant-.git main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✓ Successfully pushed to GitHub!${NC}"
    else
        echo ""
        echo -e "${RED}✗ Push failed. Check your token permissions.${NC}"
        exit 1
    fi
else
    echo ""
    echo -e "${GREEN}✓ Successfully pushed to GitHub!${NC}"
fi



