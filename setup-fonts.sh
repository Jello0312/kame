#!/bin/bash
# Kame Brand — Font Setup Script
# Run this in the Kame project root to install Plus Jakarta Sans

FONT_DIR="apps/mobile/assets/fonts"
mkdir -p "$FONT_DIR"

echo "Downloading Plus Jakarta Sans from Google Fonts..."

# Method 1: npm package (most reliable)
npm install @fontsource/plus-jakarta-sans --save-dev 2>/dev/null
if [ -d "node_modules/@fontsource/plus-jakarta-sans/files" ]; then
  cp node_modules/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-400-normal.woff2 "$FONT_DIR/" 2>/dev/null
  echo "Copied from npm package"
fi

# Method 2: Direct download from Google Fonts API
GFONTS_URL="https://fonts.google.com/download?family=Plus+Jakarta+Sans"
curl -sL "$GFONTS_URL" -o /tmp/pjs.zip 2>/dev/null && \
  unzip -o /tmp/pjs.zip -d /tmp/pjs 2>/dev/null && \
  cp /tmp/pjs/static/*.ttf "$FONT_DIR/" 2>/dev/null && \
  echo "Copied from Google Fonts download" || \
  echo "Direct download failed, using Method 3"

# Method 3: fontsource npm package (alternative)
if [ ! -f "$FONT_DIR/PlusJakartaSans-Regular.ttf" ]; then
  echo ""
  echo "MANUAL STEP NEEDED:"
  echo "1. Go to: https://fonts.google.com/specimen/Plus+Jakarta+Sans"
  echo "2. Click 'Download Family'"
  echo "3. Unzip and copy these files to $FONT_DIR/:"
  echo "   - PlusJakartaSans-Regular.ttf"
  echo "   - PlusJakartaSans-Medium.ttf"  
  echo "   - PlusJakartaSans-SemiBold.ttf"
  echo "   - PlusJakartaSans-Bold.ttf"
  echo "   - PlusJakartaSans-BoldItalic.ttf"
fi

echo ""
echo "Font setup complete. Files in: $FONT_DIR/"
ls -la "$FONT_DIR/"
