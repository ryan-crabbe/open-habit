# Documentation Improvement Plan

## Current State

The documentation consists of:
- `architecture.md` - App structure, navigation, state management, data flow
- `database.md` - SQLite schema, CRUD operations, validation
- `components.md` - UI components with props and usage
- `hooks-and-utilities.md` - Custom hooks and utility functions
- `screens-and-features.md` - All screens and user flows
- `index.md` - Landing page (minimal)
- `privacy.md` - Privacy policy
- `terms.md` - Terms of service
- `README.md` (in open-habit-mobile/) - Project overview and setup

## Issues to Fix

### High Priority

1. **Fix inconsistencies across documents**
   - [x] Standardize default theme value (system)
   - [x] Update schema version references to v2
   - [x] Remove absolute file paths, use relative paths
   - [x] Ensure all dates are consistent (January 2026)

2. **Expand index.md as documentation hub**
   - [x] Add links to all documentation files
   - [x] Brief descriptions of each document
   - [x] Quick start section

3. **Update README.md**
   - [x] Fix placeholder GitHub URL (`yourusername`)
   - [ ] Add app screenshots or demo GIF
   - [ ] Add badges (version, license)

### Medium Priority

4. **Add missing documentation**
   - [x] Create `CONTRIBUTING.md` with:
     - Code style guidelines
     - PR process
     - Branch naming conventions
     - Commit message format

   - [x] Create `testing.md` with:
     - How to run tests
     - Test structure
     - Writing new tests
     - Test data fixtures

   - [x] Create `deployment.md` with:
     - EAS Build configuration
     - Production build steps
     - App Store submission checklist
     - Version management

5. **Add troubleshooting section**
   - [ ] Common development issues
   - [ ] Database debugging
   - [ ] Notification troubleshooting
   - [ ] Platform-specific issues

### Low Priority

6. **Enhancements**
   - [x] Add CHANGELOG.md for version history
   - [ ] Create API quick reference card
   - [ ] Add component visual examples/screenshots
   - [ ] Create glossary of terms

## Documentation Structure (Target)

```
docs/
├── index.md                 # Documentation hub with links to all docs
├── architecture.md          # System architecture and design
├── database.md              # Database schema and operations
├── components.md            # UI component reference
├── hooks-and-utilities.md   # Hooks and utility functions
├── screens-and-features.md  # Screen documentation and user flows
├── testing.md               # Testing guide (NEW)
├── deployment.md            # Build and release guide (NEW)
├── CONTRIBUTING.md          # Contribution guidelines (NEW)
├── CHANGELOG.md             # Version history (NEW)
├── privacy.md               # Privacy policy (for GitHub Pages)
├── terms.md                 # Terms of service (for GitHub Pages)
└── _config.yml              # Jekyll configuration

open-habit-mobile/
├── README.md                # Project overview and quick start
└── CLAUDE.md                # AI assistant quick reference
```

## Implementation Order

1. Fix inconsistencies in existing docs (quick wins)
2. Expand index.md
3. Update README.md with screenshots
4. Create CONTRIBUTING.md
5. Create testing.md
6. Create deployment.md
7. Add CHANGELOG.md

## Notes

- Keep documentation concise and practical
- Include code examples where helpful
- Use relative paths for portability
- Update docs when code changes
