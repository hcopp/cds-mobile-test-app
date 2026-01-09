# CDS Mobile Test App

A simple test application for experimenting with `@coinbase/cds-mobile` and `@coinbase/cds-mobile-visualization` components using the React Native New Architecture.

## Tech Stack

- **Expo SDK 53** with New Architecture enabled
- **React Native 0.79.6** (Fabric + TurboModules)
- **React 19**

## Prerequisites

- Node.js (v18 or later recommended)
- Yarn package manager
- iOS Simulator (macOS) or Android Emulator
- [Expo Go](https://expo.dev/client) app on your device (for quick testing)

## Getting Started

### 1. Install dependencies

```bash
yarn install
```

### 2. Start the development server

```bash
yarn start
```

This will start the Metro bundler and display a QR code. You can:
- Press `i` to open in iOS Simulator
- Press `a` to open in Android Emulator
- Scan the QR code with Expo Go on your device

### 3. Run on a specific platform (with native build)

For a full development build with native debugging:

```bash
# iOS
yarn ios

# Android
yarn android
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `yarn start` | Start the Expo development server |
| `yarn ios` | Build and run on iOS (requires Xcode) |
| `yarn android` | Build and run on Android (requires Android Studio) |
| `yarn web` | Start the web version |

## Debugging

- Press `j` in the Metro terminal to open the JavaScript debugger
- Press `m` to toggle the developer menu
- Press `r` to reload the app

For native crash logs:

```bash
npx react-native log-ios
# or
npx react-native log-android
```

## Project Structure

```
├── App.js          # Main application entry point
├── index.js        # Expo entry file
├── app.json        # Expo configuration (New Architecture enabled)
└── package.json    # Dependencies and scripts
```

## Notes

- The New Architecture is enabled via `"newArchEnabled": true` in `app.json`
- Some peer dependency warnings may appear during install - these are generally safe to ignore for testing purposes
