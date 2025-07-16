#!/bin/bash

# FlightAbove DMG Build Script
# This script builds production-ready DMG files for both x64 and ARM64 architectures

set -e

# Change to project root directory
cd "$(dirname "$0")/.."

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")

echo "🚀 Building FlightAbove DMG files for version $VERSION..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf release dist

# Build the application
echo "🔨 Building application..."
npm run build

# Package for both architectures
echo "📦 Packaging for x64 architecture..."
npx electron-packager . FlightAbove --platform=darwin --arch=x64 --out=release --overwrite --icon=assets/icon.png

echo "📦 Packaging for ARM64 architecture..."
npx electron-packager . FlightAbove --platform=darwin --arch=arm64 --out=release --overwrite --icon=assets/icon.png

# Create DMG files with custom layout
echo "💿 Creating DMG for x64..."
mkdir -p release/dmg/.background
cp -r release/FlightAbove-darwin-x64/FlightAbove.app release/dmg/

# Create Applications folder link
ln -s /Applications release/dmg/Applications

# Copy background image if it exists
if [ -f "assets/dmg-background/background.png" ]; then
    cp assets/dmg-background/background.png release/dmg/.background/background.png
fi

# Create DMG
hdiutil create -volname "FlightAbove" -srcfolder release/dmg -ov -format UDZO release/FlightAbove-$VERSION.dmg

# Configure DMG window layout
if [ -f "assets/dmg-background/background.png" ]; then
    echo "🎨 Configuring DMG window layout..."
    # Mount the DMG
    hdiutil attach release/FlightAbove-$VERSION.dmg -noautoopen
    
    # Get the mount point
    DMG_MOUNT=$(hdiutil info | grep "/Volumes/FlightAbove" | head -1 | awk '{print $3}')
    
    if [ -n "$DMG_MOUNT" ]; then
        osascript << EOF
tell application "Finder"
    tell disk "FlightAbove"
        open
        set current view of container window to icon view
        set toolbar visible of container window to false
        set statusbar visible of container window to false
        set the bounds of container window to {400, 100, 1200, 700}
        set theViewOptions to the icon view options of container window
        set icon size of theViewOptions to 128
        set arrangement of theViewOptions to not arranged
        set background picture of theViewOptions to file ".background:background.png"
        set position of item "FlightAbove.app" of container window to {200, 200}
        set position of item "Applications" of container window to {500, 200}
        update without registering applications
        delay 2
        close
    end tell
end tell
EOF
    fi
    
    # Unmount the DMG
    hdiutil detach "$DMG_MOUNT" -force
fi

echo "💿 Creating DMG for ARM64..."
mkdir -p release/dmg-arm64/.background
cp -r release/FlightAbove-darwin-arm64/FlightAbove.app release/dmg-arm64/

# Create Applications folder link
ln -s /Applications release/dmg-arm64/Applications

# Copy background image if it exists
if [ -f "assets/dmg-background/background.png" ]; then
    cp assets/dmg-background/background.png release/dmg-arm64/.background/background.png
fi

# Create DMG
hdiutil create -volname "FlightAbove" -srcfolder release/dmg-arm64 -ov -format UDZO release/FlightAbove-$VERSION-arm64.dmg

# Configure DMG window layout for ARM64
if [ -f "assets/dmg-background/background.png" ]; then
    echo "🎨 Configuring ARM64 DMG window layout..."
    # Mount the DMG
    hdiutil attach release/FlightAbove-$VERSION-arm64.dmg -noautoopen
    
    # Get the mount point
    DMG_MOUNT=$(hdiutil info | grep "/Volumes/FlightAbove" | head -1 | awk '{print $3}')
    
    if [ -n "$DMG_MOUNT" ]; then
        osascript << EOF
tell application "Finder"
    tell disk "FlightAbove"
        open
        set current view of container window to icon view
        set toolbar visible of container window to false
        set statusbar visible of container window to false
        set the bounds of container window to {400, 100, 1200, 700}
        set theViewOptions to the icon view options of container window
        set icon size of theViewOptions to 128
        set arrangement of theViewOptions to not arranged
        set background picture of theViewOptions to file ".background:background.png"
        set position of item "FlightAbove.app" of container window to {200, 200}
        set position of item "Applications" of container window to {500, 200}
        update without registering applications
        delay 2
        close
    end tell
end tell
EOF
    fi
    
    # Unmount the DMG
    hdiutil detach "$DMG_MOUNT" -force
fi

# Clean up temporary directories
echo "🧹 Cleaning up temporary directories..."
rm -rf release/dmg release/dmg-arm64

# Show final results
echo "✅ Build complete! Generated files:"
ls -lh release/*.dmg

echo ""
echo "🎉 DMG files created successfully!"
echo "• FlightAbove-$VERSION.dmg (Intel x64)"
echo "• FlightAbove-$VERSION-arm64.dmg (Apple Silicon)"
echo ""
echo "You can now distribute these DMG files to users." 