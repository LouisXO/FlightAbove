#!/bin/bash

# FlightAbove DMG Build Script
# This script builds production-ready DMG files for both x64 and ARM64 architectures

set -e

echo "🚀 Building FlightAbove DMG files..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf release

# Build the application
echo "🔨 Building application..."
npm run build

# Package for both architectures
echo "📦 Packaging for x64 architecture..."
npx electron-packager . FlightAbove --platform=darwin --arch=x64 --out=release --overwrite

echo "📦 Packaging for ARM64 architecture..."
npx electron-packager . FlightAbove --platform=darwin --arch=arm64 --out=release --overwrite

# Create DMG files
echo "💿 Creating DMG for x64..."
mkdir -p release/dmg
cp -r release/FlightAbove-darwin-x64/FlightAbove.app release/dmg/
hdiutil create -volname "FlightAbove" -srcfolder release/dmg -ov -format UDZO release/FlightAbove-1.0.0.dmg

echo "💿 Creating DMG for ARM64..."
mkdir -p release/dmg-arm64
cp -r release/FlightAbove-darwin-arm64/FlightAbove.app release/dmg-arm64/
hdiutil create -volname "FlightAbove" -srcfolder release/dmg-arm64 -ov -format UDZO release/FlightAbove-1.0.0-arm64.dmg

# Clean up temporary directories
echo "🧹 Cleaning up temporary directories..."
rm -rf release/dmg release/dmg-arm64

# Show final results
echo "✅ Build complete! Generated files:"
ls -lh release/*.dmg

echo ""
echo "🎉 DMG files created successfully!"
echo "• FlightAbove-1.0.0.dmg (Intel x64)"
echo "• FlightAbove-1.0.0-arm64.dmg (Apple Silicon)"
echo ""
echo "You can now distribute these DMG files to users." 