# FlightAbove CI/CD Guide

This guide explains the optimized CI/CD process for FlightAbove, including automated testing, building, and release management.

## 🚀 Overview

The CI/CD system consists of two main workflows:

1. **CI Workflow** (`ci.yml`) - Runs on every push/PR
2. **Release Workflow** (`release.yml`) - Handles version management and releases

## 📋 CI Workflow

### What it does:
- ✅ Runs on every push to `main` and pull requests
- 🔍 Lints code for quality
- 🧪 Runs tests (if available)
- 🏗️ Builds the application
- 📦 Creates artifacts for releases (on main branch only)

### Process:
1. **Test Job** (Ubuntu):
   - Installs dependencies with caching
   - Runs linting
   - Runs tests
   - Builds application
   - Validates build output

2. **Build Job** (macOS):
   - Only runs on pushes to main branch
   - Builds and packages the application
   - Uploads DMG files as artifacts

## 🎯 Release Workflow

### What it does:
- 🔄 Automatically handles version management
- 📦 Creates new releases or updates existing ones
- 🏷️ Manages GitHub releases and tags
- 🎛️ Supports manual releases via GitHub Actions UI

### Smart Version Handling:

#### Same Version Updates
If you push changes with the same version number:
- ✅ Updates existing release assets
- 📝 Updates release notes with "(Updated)" indicator
- 🔄 Replaces old DMG files with new ones

#### New Version Releases
If you push with a new version:
- 🆕 Creates a new GitHub release
- 🏷️ Creates a new version tag
- 📦 Uploads new DMG files
- 📝 Generates fresh release notes

## 🛠️ Version Management

### Automated Version Bumping

The release workflow automatically detects version changes from `package.json`. To update versions:

```bash
# Increment patch version (1.0.0 -> 1.0.1)
npm version patch

# Increment minor version (1.0.0 -> 1.1.0)
npm version minor

# Increment major version (1.0.0 -> 2.0.0)
npm version major

# Set specific version
npm version 1.2.3
```

### Using the Version Script

We've created a convenient script for version management:

```bash
# Make the script executable (first time only)
chmod +x scripts/version.sh

# Increment patch version
./scripts/version.sh patch

# Increment minor version
./scripts/version.sh minor

# Increment major version
./scripts/version.sh major

# Set specific version
./scripts/version.sh set 1.2.3
```

The script automatically:
- ✅ Updates version in `package.json`
- 📝 Updates DMG filenames in build scripts
- 📄 Creates/updates `RELEASE.md`
- 💡 Provides next steps for release

## 🎮 Manual Releases

### Via GitHub Actions UI:
1. Go to your repository on GitHub
2. Navigate to **Actions** tab
3. Select **Release** workflow
4. Click **Run workflow**
5. Enter the version number (e.g., `1.0.1`)
6. Click **Run workflow**

### Via Git Tags:
```bash
# Create and push a tag
git tag v1.0.1
git push origin v1.0.1
```

## 📦 Release Process

### Automatic Process:
1. **Version Detection**: Reads version from `package.json`
2. **Release Check**: Checks if release already exists
3. **Asset Management**: 
   - New version: Creates new release
   - Same version: Updates existing release
4. **File Upload**: Uploads DMG files for both Intel and Apple Silicon
5. **Release Notes**: Generates comprehensive release notes

### Release Assets:
- `FlightAbove-{version}.dmg` (Intel Mac)
- `FlightAbove-{version}-arm64.dmg` (Apple Silicon)

## 🔧 Configuration

### Required Secrets:
The workflows use the default `GITHUB_TOKEN` secret, which is automatically provided by GitHub.

### Environment Variables:
- `GITHUB_TOKEN`: Automatically provided by GitHub Actions
- `NODE_VERSION`: Set to 18 in workflows

## 🚨 Troubleshooting

### Common Issues:

#### Build Fails
```bash
# Check if all dependencies are installed
npm ci

# Clear cache and rebuild
npm run clean
npm run build
```

#### Release Not Created
- ✅ Ensure you're on the `main` branch
- ✅ Check that version in `package.json` is correct
- ✅ Verify GitHub Actions have proper permissions

#### DMG Files Not Found
```bash
# Ensure build completed successfully
npm run dist

# Check release directory
ls -la release/
```

### Debug Mode:
```bash
# Enable verbose logging
DEBUG=* npm run build

# Check workflow logs in GitHub Actions
```

## 📈 Performance Optimizations

### Caching:
- ✅ npm dependencies cached between runs
- ✅ Node.js installation cached
- ✅ Build artifacts preserved for 30 days

### Parallel Jobs:
- ✅ Test and build jobs run in parallel when possible
- ✅ Separate environments for testing (Ubuntu) and building (macOS)

### Resource Usage:
- ✅ Uses `npm ci` for faster, reliable installs
- ✅ Efficient artifact retention (30 days)
- ✅ Conditional job execution to save resources

## 🔄 Workflow Triggers

### CI Workflow:
- ✅ Push to `main` branch
- ✅ Pull requests to `main` branch

### Release Workflow:
- ✅ Push to `main` branch
- ✅ Push tags starting with `v*`
- ✅ Manual trigger via GitHub Actions UI

## 📝 Best Practices

### Version Management:
1. **Use Semantic Versioning**: `MAJOR.MINOR.PATCH`
2. **Update Version Before Release**: Use the version script
3. **Test Before Release**: Ensure CI passes before tagging

### Release Process:
1. **Update Version**: Use `./scripts/version.sh patch`
2. **Test Changes**: Ensure CI workflow passes
3. **Commit Changes**: `git add . && git commit -m "Bump version"`
4. **Create Tag**: `git tag v{version}`
5. **Push Everything**: `git push && git push --tags`

### Code Quality:
1. **Run Linting**: `npm run lint`
2. **Fix Issues**: `npm run lint:fix`
3. **Test Locally**: `npm run build`

## 🎯 Quick Start

### For New Releases:
```bash
# 1. Update version
./scripts/version.sh patch

# 2. Review changes
git diff

# 3. Commit and push
git add .
git commit -m "Bump version to $(node -p "require('./package.json').version")"
git push

# 4. Create tag and push
git tag v$(node -p "require('./package.json').version")
git push --tags
```

### For Manual Releases:
1. Go to GitHub Actions
2. Select "Release" workflow
3. Click "Run workflow"
4. Enter version number
5. Click "Run workflow"

---

**The CI/CD system is designed to be efficient, reliable, and easy to use. It automatically handles the complexity of version management while providing clear feedback and easy troubleshooting.** 