#!/bin/bash

# Version bump script for Crypto Momentum Trader
# Usage: ./bump.sh [major|minor|patch]
# Default: patch

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get current version from package.json
CURRENT_VERSION=$(grep -o '"version": "[^"]*"' package.json | head -1 | cut -d'"' -f4)

if [ -z "$CURRENT_VERSION" ]; then
    echo "Error: Could not read current version from package.json"
    exit 1
fi

# Parse version components
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

# Determine bump type
BUMP_TYPE="${1:-patch}"

case "$BUMP_TYPE" in
    major)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        ;;
    minor)
        MINOR=$((MINOR + 1))
        PATCH=0
        ;;
    patch)
        PATCH=$((PATCH + 1))
        ;;
    *)
        echo "Usage: ./bump.sh [major|minor|patch]"
        echo "  major: X.0.0 (breaking changes)"
        echo "  minor: x.X.0 (new features)"
        echo "  patch: x.x.X (bug fixes) [default]"
        exit 1
        ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"

echo -e "${YELLOW}Bumping version: ${CURRENT_VERSION} → ${NEW_VERSION}${NC}"

# Update package.json
sed -i "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json

# Update server.js banner
sed -i "s/CRYPTO MOMENTUM TRADER v$CURRENT_VERSION/CRYPTO MOMENTUM TRADER v$NEW_VERSION/" server.js

# Update README.md
sed -i "s/\*\*Version:\*\* $CURRENT_VERSION/**Version:** $NEW_VERSION/" README.md

echo -e "${GREEN}✓ package.json${NC}"
echo -e "${GREEN}✓ server.js${NC}"
echo -e "${GREEN}✓ README.md${NC}"
echo ""
echo -e "${GREEN}Version bumped to $NEW_VERSION${NC}"
