# Stay Strong - 30-Day Recovery Blocker

A hybrid React Native + Kotlin app that provides **system-level pornography blocking** for Android with a bulletproof 30-day hard lock.

## Architecture

**Hybrid two-layer protection:**

1. **React Native Frontend** — Dashboard, stats, motivational popups, Device Admin UI
2. **Kotlin VPN Service** — System-level DNS blocking, runs independently, survives app deletion

## Features

✅ **30-Day Hard Lock** — Timer cannot be stopped, survives device reboots
✅ **VPN-Level Blocking** — System-wide, can't be bypassed by app deletion
✅ **Device Admin** — Prevents uninstall during recovery period
✅ **Motivational Popups** — 15 rotating messages to encourage recovery
✅ **Block Statistics** — Daily/total blocks, unique domains, streak counter
✅ **Auto-Restart on Boot** — VPN reactivates after reboot if period active

## Setup

### Prerequisites
- Node.js & npm
- Expo CLI: `npm install -g expo-cli`
- Android Studio or Android SDK
- Expo account (expo.dev)

### Installation

1. **Extract the ZIP** and navigate to the project:
   ```bash
   cd StayStrong-Hybrid
   npm install
   ```

2. **Push to your Expo project** (assuming @drakenfr10/staystrong exists):
   ```bash
   expo login
   expo publish
   ```
   Or build directly:
   ```bash
   eas build --platform android --profile production
   ```

3. **Install on Android device**:
   - Download APK from Expo dashboard
   - Install: `adb install app-release.apk`
   - Or scan QR code with Expo Go app

### First Launch

1. **App starts, checks for existing timer**
2. **Prompts to enable Device Admin** — This is essential
   - Tap "Enable Device Admin (Prevents Uninstall)"
   - Confirm in Android settings
3. **VPN Service activates** — System-level blocking begins
4. **Timer displays 30 days remaining**
5. **All controls locked during the 30-day period**

## Protection Layers

### Layer 1: VPN Service (Kotlin)
- Intercepts all DNS queries system-wide
- Blocks known adult domain patterns
- Runs at OS level (cannot be stopped by app deletion)
- Auto-restarts on boot
- Timer embedded: expires after 30 days

### Layer 2: Device Admin (Android)
- Prevents casual uninstall
- Requires deliberate removal from Settings → Device Admin
- Adds friction during vulnerable moments

### Layer 3: App-Level UI
- Timer display (cannot be paused)
- All disable buttons locked
- Motivational messages on every screen

## Files

```
StayStrong-Hybrid/
├── src/
│   └── App.js                    (React Native UI)
├── android/app/src/main/java/com/staystrong/
│   ├── VPNService.kt            (System VPN service)
│   ├── VPNModule.kt             (React Native bridge)
│   ├── DeviceAdminModule.kt      (Device Admin bridge)
│   ├── StayStrongDeviceAdminReceiver.kt
│   └── BootCompletedReceiver.kt  (Auto-restart on boot)
├── res/xml/
│   └── device_admin_receiver.xml (Device Admin policies)
├── package.json
├── app.json
├── babel.config.js
├── index.js
├── AndroidManifest.xml
└── README.md
```

## Technical Details

### Blocked Domains (VPN Service)
```
pornhub, xvideos, xnxx, redtube, youporn, tube8,
spankbang, tnaflix, drtuber, thumbzilla, mofosex,
brazzers, naughtyamerica, realitykings, bangbros, digital
```

List is in VPNService.kt `isDomainBlocked()` — add/remove as needed.

### Timer Mechanism
- **Storage:** SharedPreferences (`staystrong_vpn` → `vpn_start_time`)
- **Duration:** 30 days (exactly `30 * 24 * 60 * 60 * 1000` ms)
- **Check:** On app launch and every minute via background handler
- **Expiry:** VPN service stops automatically after 30 days

### AsyncStorage Keys (React Native)
- `@staystrong_start_time` — Timestamp of activation (ms)
- `@staystrong_blocks` — JSON array of blocked site attempts
- `@staystrong_stats` — Daily stats and streak counter

## Customization

### Add/Remove Blocked Domains
Edit `VPNService.kt`, function `isDomainBlocked()`:
```kotlin
private fun isDomainBlocked(domain: String): Boolean {
    val blockedDomains = listOf(
        "pornhub", "xvideos", // add/remove as needed
    )
    // ...
}
```

### Change Timer Duration
Edit `VPNService.kt` and `App.js`:
- VPNService: `val thirtyDaysMs = 30L * 24 * 60 * 60 * 1000`
- App.js: Same constant in `updateTimer()`

### Customize Motivational Messages
Edit `App.js`, constant `MOTIVATIONAL`:
```javascript
const MOTIVATIONAL = [
  "Your custom message here",
  "Add as many as you want",
];
```

## Troubleshooting

### VPN doesn't start
- Ensure Device Admin is enabled
- Check Android version (min SDK 21)
- Verify `BIND_VPN_SERVICE` permission in manifest

### App crashes on launch
- Verify `package.json` has all dependencies installed
- Run `npm install` again
- Check Expo build logs

### Timer resets unexpectedly
- Don't uninstall the app during the 30-day period
- If uninstalled, timer stored in kernel and resets
- Solution: Don't uninstall — Device Admin prevents it anyway

### Device Admin won't activate
- Go to Settings → Security → Device Admin Apps
- Look for "Stay Strong" and toggle on
- May require password/PIN

## Safety Notes

⚠️ **This app is designed for recovery, not as a perfect barrier.** It adds significant friction through:
- System-level VPN blocking (hard to bypass)
- Device Admin (requires deliberate removal)
- 30-day timer (no early exit)

However, someone with technical knowledge *could* bypass it via:
- ADB (requires developer mode + computer)
- Factory reset (destroys all data)
- Rooting device (breaks system integrity)

**The real protection is commitment.** This app buys time and makes relapse harder. Use it as part of a broader recovery strategy.

## Support

For issues, check the Expo documentation or Android Studio logcat for detailed errors.

---

**Built for recovery. Designed for persistence. Forged in the Storm.**

Stay strong. 💪
