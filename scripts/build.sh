#!/bin/bash

# Health3 Chrome Extensions — Build Script
# Packages both extensions into .zip files ready for Chrome Web Store upload.
#
# Usage: ./scripts/build.sh
# Output: extensions/dist/unit-converter.zip, extensions/dist/lab-explainer.zip

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
EXT_DIR="$(dirname "$SCRIPT_DIR")"
DIST_DIR="$EXT_DIR/dist"

echo "Health3 Chrome Extension Builder"
echo "================================"

# Clean and create dist directory
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# --- Unit Converter ---
echo ""
echo "Building: Unit Converter"
TEMP=$(mktemp -d)
cp -r "$EXT_DIR/unit-converter/"* "$TEMP/"
mkdir -p "$TEMP/shared"
cp -r "$EXT_DIR/shared/data" "$TEMP/shared/"
cp -r "$EXT_DIR/shared/styles" "$TEMP/shared/"
cp "$EXT_DIR/shared/converter.js" "$TEMP/shared/"

cd "$TEMP"
zip -r "$DIST_DIR/unit-converter.zip" . -x "*.DS_Store"
rm -rf "$TEMP"
echo "  -> dist/unit-converter.zip"

# --- Lab Explainer ---
echo ""
echo "Building: Lab Explainer"
TEMP=$(mktemp -d)
cp -r "$EXT_DIR/lab-explainer/"* "$TEMP/"
mkdir -p "$TEMP/shared"
cp -r "$EXT_DIR/shared/data" "$TEMP/shared/"
cp -r "$EXT_DIR/shared/styles" "$TEMP/shared/"
cp "$EXT_DIR/shared/converter.js" "$TEMP/shared/"
cp "$EXT_DIR/shared/biomarker-lookup.js" "$TEMP/shared/"

cd "$TEMP"
zip -r "$DIST_DIR/lab-explainer.zip" . -x "*.DS_Store"
rm -rf "$TEMP"
echo "  -> dist/lab-explainer.zip"

echo ""
echo "Done! Upload .zip files to Chrome Web Store Developer Dashboard."
echo "https://chrome.google.com/webstore/devconsole"
