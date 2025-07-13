#!/bin/bash

# Version management script for FlightAbove
# Usage: ./scripts/version.sh [patch|minor|major|set <version>]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Function to get current version
get_current_version() {
    node -p "require('./package.json').version"
}

# Function to update version
update_version() {
    local version_type=$1
    local new_version=$2
    
    if [ "$version_type" = "set" ]; then
        npm version "$new_version" --no-git-tag-version
        print_status "Version set to $new_version"
    else
        npm version "$version_type" --no-git-tag-version
        new_version=$(get_current_version)
        print_status "Version bumped to $new_version"
    fi
}

# Function to update DMG filenames
update_dmg_names() {
    local version=$(get_current_version)
    
    # Update the DMG creation scripts with new version
    sed -i.bak "s/FlightAbove-1\.0\.0\.dmg/FlightAbove-$version.dmg/g" package.json
    sed -i.bak "s/FlightAbove-1\.0\.0-arm64\.dmg/FlightAbove-$version-arm64.dmg/g" package.json
    
    # Clean up backup files
    rm -f package.json.bak
    
    print_status "Updated DMG filenames to version $version"
}

# Function to create release notes
create_release_notes() {
    local version=$(get_current_version)
    local release_file="RELEASE.md"
    
    cat > "$release_file" << EOF
# FlightAbove $version

## 📦 What's New

- Bug fixes and improvements
- Enhanced performance and stability

## 🔧 Installation

1. Download the appropriate DMG for your Mac:
   - Intel Mac (x64): \`FlightAbove-$version.dmg\`
   - Apple Silicon: \`FlightAbove-$version-arm64.dmg\`
2. Open the DMG file
3. Drag FlightAbove to your Applications folder
4. Launch from Applications

## 📋 System Requirements

- macOS 10.14 or later
- Internet connection
- 100MB free disk space
- Location services (IP-based)

## 🐛 Known Issues

- Initial startup may take a few seconds while caching airline logos
- Menu bar icon may need a refresh after system sleep
- Search radius above 200km may impact performance

For complete documentation, see [README.md](README.md)
EOF

    print_status "Created release notes in $release_file"
}

# Function to prepare for release
prepare_release() {
    local version_type=$1
    local new_version=$2
    
    print_header "Preparing Release"
    
    # Update version
    if [ "$version_type" = "set" ]; then
        update_version "set" "$new_version"
    else
        update_version "$version_type"
    fi
    
    # Update DMG names
    update_dmg_names
    
    # Create release notes
    create_release_notes
    
    print_status "Release preparation complete!"
    print_status "Next steps:"
    echo "  1. Review changes: git diff"
    echo "  2. Commit changes: git add . && git commit -m \"Bump version to $(get_current_version)\""
    echo "  3. Create tag: git tag v$(get_current_version)"
    echo "  4. Push changes: git push && git push --tags"
    echo "  5. Or use GitHub Actions: Go to Actions > Release > Run workflow"
}

# Main script logic
main() {
    if [ $# -eq 0 ]; then
        print_error "Usage: $0 [patch|minor|major|set <version>]"
        echo ""
        echo "Commands:"
        echo "  patch    - Increment patch version (1.0.0 -> 1.0.1)"
        echo "  minor    - Increment minor version (1.0.0 -> 1.1.0)"
        echo "  major    - Increment major version (1.0.0 -> 2.0.0)"
        echo "  set      - Set specific version (e.g., set 1.2.3)"
        echo ""
        echo "Current version: $(get_current_version)"
        exit 1
    fi
    
    local command=$1
    local version=$2
    
    case $command in
        "patch"|"minor"|"major")
            prepare_release "$command"
            ;;
        "set")
            if [ -z "$version" ]; then
                print_error "Version required for 'set' command"
                echo "Usage: $0 set <version>"
                exit 1
            fi
            prepare_release "set" "$version"
            ;;
        *)
            print_error "Unknown command: $command"
            echo "Use: patch, minor, major, or set <version>"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@" 