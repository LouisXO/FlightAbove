#!/bin/bash

# Create DMG Background Script
# This script creates a custom background image for the DMG

set -e

# Change to project root directory
cd "$(dirname "$0")/.."

echo "🎨 Creating DMG background image..."

# Create background directory
mkdir -p assets/dmg-background

# Check if ImageMagick is installed
if ! command -v magick &> /dev/null; then
    echo "❌ ImageMagick is not installed. Installing..."
    brew install imagemagick
fi

# Create a custom background image
magick -size 800x600 canvas:'#2C3E50' \
  -fill '#ECF0F1' -font Arial-Bold -pointsize 48 -gravity center -annotate +0-50 'FlightAbove' \
  -fill '#3498DB' -font Arial -pointsize 24 -gravity center -annotate +0+50 'Drag to Applications to install' \
  assets/dmg-background/background.png

echo "✅ Background image created at assets/dmg-background/background.png"
echo "You can replace this with your own custom background image." 