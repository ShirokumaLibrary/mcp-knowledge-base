# Publishing to npm

## Pre-publish Checklist

- [ ] All tests pass (`npm test`)
- [ ] Build is successful (`npm run build`)
- [ ] Version number updated in `package.json`
- [ ] CHANGELOG.md updated with new version
- [ ] README.md is complete and accurate
- [ ] LICENSE file exists
- [ ] No sensitive information in code
- [ ] .npmignore configured correctly

## Publishing Steps

### 1. Clean and Build
```bash
npm run clean
npm run build
npm test
```

### 2. Check Package Contents
```bash
# See what files will be included
npm pack --dry-run

# Or create a tarball to inspect
npm pack
tar -tzf shirokuma-mcp-knowledge-base-*.tgz
```

### 3. Update Version
```bash
# Patch version (0.4.2 -> 0.4.3)
npm version patch

# Minor version (0.4.2 -> 0.5.0)
npm version minor

# Major version (0.4.2 -> 1.0.0)
npm version major
```

### 4. Login to npm
```bash
npm login
```

### 5. Publish

#### First Time Publishing
```bash
# Publish publicly
npm publish --access public
```

#### Update Publishing
```bash
npm publish
```

### 6. Verify Publication
```bash
# Check if published
npm view shirokuma-mcp-knowledge-base

# Test installation
npm install -g shirokuma-mcp-knowledge-base
shirokuma-mcp --version
```

## Post-publish

1. Create a GitHub release with the same version tag
2. Announce the release (if applicable)
3. Update any dependent projects

## Troubleshooting

### Common Issues

1. **Authentication Error**
   ```bash
   npm login
   ```

2. **Version Already Exists**
   - Increment version number
   - npm doesn't allow republishing same version

3. **Files Too Large**
   - Check .npmignore
   - Ensure dist/ doesn't include unnecessary files
   - Run production build (`npm run build`)

4. **Scoped Package**
   If you want to publish under an organization:
   ```json
   "name": "@yourorg/shirokuma-mcp-knowledge-base"
   ```
   Then publish with:
   ```bash
   npm publish --access public
   ```

## Unpublishing (Use with Caution!)

```bash
# Unpublish a specific version (within 72 hours)
npm unpublish shirokuma-mcp-knowledge-base@0.4.2

# Deprecate instead of unpublish
npm deprecate shirokuma-mcp-knowledge-base@0.4.2 "Critical bug, please use 0.4.3"
```