# FlightAbove Release Guide

This guide explains how to build and distribute FlightAbove DMG files for macOS.

## 🚀 Quick Build

To build production-ready DMG files for distribution:

```bash
npm run build:dmg
```

This will create:
- `FlightAbove-1.0.0.dmg` (Intel x64)
- `FlightAbove-1.0.0-arm64.dmg` (Apple Silicon)

## 📦 Build Options

### Method 1: Automated Script (Recommended)
```bash
npm run build:dmg
```
Uses the `scripts/build-dmg.sh` script to handle everything automatically.

### Method 2: Manual Build Process
```bash
# Build the application
npm run build

# Package for both architectures
npm run package:all

# Create DMG files
npm run dmg:create
```

### Method 3: Individual Commands
```bash
# Build TypeScript and React
npm run build:main
npm run build:renderer

# Package for specific architecture
npm run package:x64    # Intel x64
npm run package:arm64  # Apple Silicon

# Create specific DMG
npm run dmg:x64
npm run dmg:arm64
```

## 📂 Output Files

All build artifacts are created in the `release/` directory:

```
release/
├── FlightAbove-1.0.0.dmg           # Intel x64 DMG
├── FlightAbove-1.0.0-arm64.dmg     # Apple Silicon DMG
├── FlightAbove-darwin-x64/         # Unpacked Intel app
│   └── FlightAbove.app
└── FlightAbove-darwin-arm64/       # Unpacked Apple Silicon app
    └── FlightAbove.app
```

## 🔧 Development vs Production

### Development
```bash
npm run dev  # Starts development server with hot reloading
```

### Production Testing
```bash
npm run build  # Build for production
npm start      # Run built app
```

## 🧹 Cleaning

```bash
npm run clean  # Remove dist/ and release/ directories
```

## 📋 System Requirements

- **macOS**: 10.14 or later
- **Node.js**: 16 or later
- **npm**: 8 or later

## 🎯 Distribution

The generated DMG files can be distributed directly to users:

1. **FlightAbove-1.0.0.dmg** - For Intel Macs (x64)
2. **FlightAbove-1.0.0-arm64.dmg** - For Apple Silicon Macs (M1/M2/M3)

Users can:
1. Download the appropriate DMG for their system
2. Double-click to mount the disk image
3. Drag FlightAbove.app to Applications folder
4. Launch from Applications or Spotlight

## 🛠️ Troubleshooting

### Build Fails
- Ensure all dependencies are installed: `npm install`
- Clean previous builds: `npm run clean`
- Check Node.js version: `node --version`

### Network Issues with electron-builder
If `npm run dist` fails due to network issues, use:
```bash
npm run build:dmg  # Uses electron-packager instead
```

### DMG Creation Fails
- Ensure you're on macOS (hdiutil is required)
- Check available disk space
- Verify app was packaged correctly in `release/` directory

## 📝 Version Updates

To update the version:
1. Update `package.json` version field
2. Update DMG names in `scripts/build-dmg.sh`
3. Update version in this documentation
4. Rebuild: `npm run build:dmg`

## 🔒 Code Signing (Optional)

For distribution outside the App Store, you may want to code sign:
```bash
codesign --sign "Developer ID Application: Your Name" release/FlightAbove-darwin-x64/FlightAbove.app
```

## 🎉 Final Steps

1. Test both DMG files on different Mac architectures
2. Verify app launches correctly after installation
3. Check all features work as expected
4. Upload to your distribution platform or website

---

**Note**: The automated build script (`npm run build:dmg`) is the recommended approach as it handles all steps, cleanup, and provides clear progress feedback. 