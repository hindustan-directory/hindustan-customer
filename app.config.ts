import type { ExpoConfig, ConfigContext } from "expo/config";

const version = "1.0.0";
const allowCleartext = process.env.EXPO_PUBLIC_ALLOW_CLEARTEXT === "true";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Hindustan Directory",
  slug: "hindustan-directory-customer",
  version,
  orientation: "portrait",
  icon: "./assets/icon.png",
  scheme: "hindustan-customer",
  userInterfaceStyle: "light",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.hindustan.directory.customer",
  },
  android: {
    package: "com.hindustan.directory.customer",
    versionCode: 1,
    adaptiveIcon: {
      backgroundColor: "#2563EB",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
    softwareKeyboardLayoutMode: "resize",
  },
  web: {
    favicon: "./assets/favicon.png",
    bundler: "metro",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-image",
    [
      "expo-image-picker",
      {
        photosPermission:
          "Allow Hindustan Directory to access your photos for profile pictures.",
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          usesCleartextTraffic: allowCleartext,
          minSdkVersion: 24,
          enableShrinkResources: true,
          enableProguardInReleaseBuilds: true,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
});
