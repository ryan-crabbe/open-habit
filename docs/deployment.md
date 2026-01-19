# Deployment Guide

This guide covers building and deploying OpenHabit to the App Store using EAS (Expo Application Services).

## Prerequisites

- Node.js 18+
- EAS CLI: `npm install -g eas-cli`
- Expo account: `eas login`
- Apple Developer account ($99/year) for iOS distribution

## Build Profiles

The project has four build profiles defined in `eas.json`:

| Profile | Purpose | Distribution | Dev Client |
|---------|---------|--------------|------------|
| `development` | Testing on physical device | Internal | Yes |
| `development-simulator` | Testing on iOS Simulator | Internal | Yes |
| `preview` | Internal testing builds | Internal | No |
| `production` | App Store release | Store | No |

### Profile Details

**development**
- Includes Expo development client for fast iteration
- Requires device registration via `eas device:create`
- Installs directly to registered devices

**development-simulator**
- Same as development but outputs `.app` for iOS Simulator
- No device registration needed
- Quick local testing

**preview**
- Production-like build without store submission
- Good for TestFlight internal testing
- Uses ad-hoc distribution

**production**
- Full App Store build
- Auto-increments build number on each build
- Signed for store distribution

## Building the App

### Development Builds

```bash
# Physical device (requires device registration first)
eas build --profile development --platform ios

# iOS Simulator
eas build --profile development-simulator --platform ios
```

After the simulator build completes, download and install:
```bash
# Get the build URL from EAS, then:
tar -xvf build.tar.gz
open -a Simulator
xcrun simctl install booted open-habit-mobile.app
```

### Preview Build

```bash
eas build --profile preview --platform ios
```

This creates an IPA you can distribute via TestFlight or ad-hoc.

### Production Build

```bash
eas build --profile production --platform ios
```

The production profile has `autoIncrement: true`, which automatically bumps the iOS `buildNumber` on each build. The `version` (1.0.0) stays the same until you manually update it in `app.json`.

## iOS-Specific Requirements

### Apple Developer Account Setup

1. Enroll at [developer.apple.com](https://developer.apple.com) ($99/year)
2. Create an App ID in App Store Connect with bundle ID: `com.ryancrabbe.openhabitmobile`
3. EAS can auto-generate certificates, or you can manage them manually

### Certificates and Provisioning

EAS handles certificates automatically by default. On first build, you'll be prompted to:

1. Log in to your Apple Developer account
2. Allow EAS to create/manage certificates
3. Register devices (for development/preview builds)

To manage certificates manually:
```bash
eas credentials
```

### Device Registration (Development/Preview)

For internal distribution builds:
```bash
# Add a device
eas device:create

# List registered devices
eas device:list
```

Share the registration URL with testers to add their devices.

## App Store Submission

### Submit with EAS

After a successful production build:

```bash
eas submit --platform ios
```

Or combine build and submit:
```bash
eas build --profile production --platform ios --auto-submit
```

### First-Time Setup

On first submission, you'll need to:

1. Create the app in [App Store Connect](https://appstoreconnect.apple.com)
2. Use bundle ID: `com.ryancrabbe.openhabitmobile`
3. Configure EAS submit credentials when prompted

### What EAS Submit Does

1. Uploads the IPA to App Store Connect
2. Waits for Apple's processing
3. Makes the build available in TestFlight

You still need to manually:
- Add app metadata in App Store Connect
- Submit for App Review
- Release to the App Store

## Version Management

### How Versioning Works

| Field | Location | Purpose |
|-------|----------|---------|
| `version` | app.json | User-facing version (1.0.0) |
| `buildNumber` | Auto-managed | Internal build identifier |

### Auto-Increment Behavior

With `"autoIncrement": true` in the production profile:
- Each `eas build --profile production` increments the build number
- Build numbers are tracked remotely by EAS
- Version stays at 1.0.0 until you change it

### When to Update Version

Update `version` in `app.json` when:
- Releasing a new version to users (1.0.0 → 1.1.0)
- Making significant changes
- Required by App Store (can't reuse version numbers)

```json
{
  "expo": {
    "version": "1.1.0"
  }
}
```

## Pre-Submission Checklist

### Required Assets

- [ ] **App Icon** (1024x1024 PNG, no alpha/transparency)
  - Current: `./assets/images/icon.png`
  - Verify with: `file assets/images/icon.png`

- [ ] **Screenshots** (required for each supported device size)
  - iPhone 6.7" (1290 x 2796)
  - iPhone 6.5" (1284 x 2778)
  - iPhone 5.5" (1242 x 2208)
  - Use iOS Simulator to capture

- [ ] **App Preview Video** (optional but recommended)

### App Store Connect Setup

- [ ] Create app in App Store Connect
- [ ] Add app description (max 4000 chars)
- [ ] Add keywords (max 100 chars total)
- [ ] Set primary category: Health & Fitness
- [ ] Add support URL
- [ ] **Add Privacy Policy URL** (required)
- [ ] Set age rating (complete questionnaire)
- [ ] Add contact information

### Privacy Policy

Apple requires a privacy policy URL. Your policy should cover:
- Data collection (this app stores data locally only)
- No third-party data sharing
- Notification permissions usage
- Contact information

Host the policy on a public URL (GitHub Pages, your website, etc.).

### App Configuration Verified

- [ ] Bundle ID matches App Store Connect: `com.ryancrabbe.openhabitmobile`
- [ ] Version number is correct
- [ ] `ITSAppUsesNonExemptEncryption: false` is set (already configured)
- [ ] All required permissions have usage descriptions

### Permissions in This App

From `app.json`:
- Notifications (for habit reminders)
- Boot completed / exact alarm (Android only)

iOS notification permission is requested at runtime by `expo-notifications`.

## Environment Considerations

### Current Configuration

The app is configured for local-only data storage:
- SQLite database stored on device
- No cloud sync or API calls
- No environment variables needed

### If Adding Environment Variables

For future API integrations:

1. Create `eas.json` environment config:
```json
{
  "build": {
    "production": {
      "env": {
        "API_URL": "https://api.example.com"
      }
    }
  }
}
```

2. Or use EAS Secrets for sensitive values:
```bash
eas secret:create --name API_KEY --value "your-key"
```

3. Access in code via `process.env.API_URL`

### Build-Specific Behavior

You can detect build type at runtime:
```javascript
import Constants from 'expo-constants';

const isDevelopment = __DEV__;
const buildProfile = Constants.expoConfig?.extra?.eas?.buildProfile;
```

## Troubleshooting

### Common Issues

**"No valid provisioning profiles"**
```bash
eas credentials --platform ios
# Select "Build Credentials" → "Set up new"
```

**Build fails with code signing error**
- Check your Apple Developer membership is active
- Verify bundle ID matches in app.json and App Store Connect

**App rejected for missing privacy policy**
- Add a valid URL to App Store Connect before submission

**Version already exists**
- Increment `version` in app.json for new submissions

### Useful Commands

```bash
# Check EAS project status
eas project:info

# View build history
eas build:list

# Cancel a running build
eas build:cancel

# View submission status
eas submit:list
```

## Quick Reference

```bash
# Development (simulator)
eas build -p ios --profile development-simulator

# Preview (TestFlight)
eas build -p ios --profile preview

# Production (App Store)
eas build -p ios --profile production

# Submit to App Store
eas submit -p ios

# Build + Submit in one command
eas build -p ios --profile production --auto-submit
```
