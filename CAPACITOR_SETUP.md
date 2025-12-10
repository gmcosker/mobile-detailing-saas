# Capacitor Setup Guide (Future)

This guide will help you wrap your PWA with Capacitor to submit to app stores.

## Prerequisites

- ✅ PWA is set up and working
- ✅ App icons are created
- ✅ App is deployed and working on Vercel

## Step 1: Install Capacitor

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android
```

## Step 2: Initialize Capacitor

```bash
npx cap init
```

When prompted:
- **App name**: DetailFlow
- **App ID**: com.detailflow.app (or your domain reversed)
- **Web dir**: `.next` (or `out` if using static export)

## Step 3: Configure Next.js for Capacitor

### Option A: Keep API Routes on Server (Recommended)

Your API routes stay on Vercel. The app calls them via HTTP.

**No changes needed** - your current setup works!

### Option B: Static Export (If Needed)

If you need a fully offline app, you'd need to:
1. Move API logic to client-side
2. Use Capacitor HTTP plugin
3. Configure static export in `next.config.ts`

**Note**: This is more complex and not recommended for your use case.

## Step 4: Build and Sync

```bash
# Build Next.js app
npm run build

# Add platforms
npx cap add ios
npx cap add android

# Sync web assets to native projects
npx cap sync
```

## Step 5: Configure Native Projects

### iOS Configuration

1. Open iOS project:
   ```bash
   npx cap open ios
   ```

2. Configure in Xcode:
   - Set app icons
   - Configure bundle identifier
   - Set up signing & certificates
   - Configure permissions (camera, notifications, etc.)

3. Build and test:
   - Run on simulator or device
   - Test all features

### Android Configuration

1. Open Android project:
   ```bash
   npx cap open android
   ```

2. Configure in Android Studio:
   - Set app icons
   - Configure package name
   - Set up signing
   - Configure permissions

3. Build and test:
   - Run on emulator or device
   - Test all features

## Step 6: Handle API Calls

Your API routes are on Vercel. The app will call them normally:

```typescript
// This works in Capacitor too!
const response = await fetch('https://your-app.vercel.app/api/appointments', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

**No changes needed** - your existing API calls work!

## Step 7: Add Native Features (Optional)

If you want native features:

```bash
npm install @capacitor/camera
npm install @capacitor/push-notifications
npm install @capacitor/geolocation
```

Then use in your code:

```typescript
import { Camera } from '@capacitor/camera'

const photo = await Camera.getPhoto({
  quality: 90,
  source: CameraSource.Camera,
  resultType: CameraResultType.Uri
})
```

## Step 8: Build for Production

### iOS

1. In Xcode:
   - Select "Any iOS Device"
   - Product → Archive
   - Distribute App
   - Submit to App Store

### Android

1. In Android Studio:
   - Build → Generate Signed Bundle/APK
   - Create release build
   - Upload to Google Play Console

## Important Notes

### API Routes

- Your Next.js API routes (`/api/*`) run on Vercel
- The Capacitor app calls them via HTTP
- This is the recommended approach
- No code changes needed!

### Environment Variables

- Use Capacitor's config for native-specific settings
- Keep API URLs in environment variables
- Use `@capacitor/preferences` for local storage

### Updates

- Web updates deploy automatically to Vercel
- Native apps need app store updates
- Consider using CodePush for over-the-air updates (optional)

## Troubleshooting

### Build Errors

- Ensure all dependencies are installed
- Clear `node_modules` and reinstall
- Check platform-specific requirements

### API Calls Failing

- Verify CORS settings on Vercel
- Check network permissions in native config
- Test API endpoints directly

### Icons Not Showing

- Ensure icons are in native project folders
- Use platform-specific icon formats
- Regenerate icons if needed

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policies](https://play.google.com/about/developer-content-policy/)

