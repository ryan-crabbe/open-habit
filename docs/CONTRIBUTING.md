# Contributing to Open Habit

Welcome! We appreciate your interest in contributing to Open Habit. This guide will help you get started.

## How to Contribute

1. **Fork** the repository
2. **Create a branch** from `main` for your changes
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** following the guidelines below
4. **Push** your branch and open a **Pull Request**

## Development Setup

See the [README](../README.md) for installation and setup instructions.

## Code Style Guidelines

### TypeScript
- Use **strict mode** - ensure all TypeScript code passes strict type checking
- Avoid `any` types; use proper type definitions

### Styling
- Use existing theme constants from `constants/theme.ts`:
  - `Spacing` - for margins, padding, gaps
  - `FontSizes` - for text sizing
  - `BorderRadius` - for rounded corners
  - `Colors` - for color values
- Use `ThemedText` and `ThemedView` components for automatic theme support

### Naming Conventions
- **Files**: `kebab-case.tsx` (e.g., `habit-card.tsx`)
- **Components**: `PascalCase` (e.g., `HabitCard`)
- **Functions/Variables**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE` or `PascalCase` for objects

## Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <description>

[optional body]
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring (no functional change)
- `chore:` - Maintenance tasks (dependencies, config, etc.)

**Examples:**
```
feat: add habit streak tracking
fix: resolve date picker timezone issue
docs: update API documentation
refactor: simplify habit completion logic
chore: update expo dependencies
```

## Pull Request Guidelines

- Keep PRs focused on a single change
- Include a clear description of what and why
- Reference any related issues (e.g., "Closes #123")
- Ensure all tests pass
- Update documentation if needed
- Request review from maintainers

## Issue Reporting

When reporting issues, please include:

1. **Description** - Clear summary of the issue
2. **Steps to Reproduce** - How to trigger the bug
3. **Expected Behavior** - What should happen
4. **Actual Behavior** - What actually happens
5. **Environment** - Device, OS version, app version
6. **Screenshots** - If applicable

Use issue templates when available.

---

Thank you for contributing!
