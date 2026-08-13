#!/usr/bin/env node
/**
 * Inject release signing into android/app/build.gradle after expo prebuild.
 * Passwords are read from env at Gradle build time — never written to disk.
 */
import fs from "node:fs";

const gradlePath = "android/app/build.gradle";
const storeFile =
  process.env.RELEASE_KEYSTORE_FILE || "hindustan-customer-release-key.keystore";

if (!process.env.RELEASE_KEYSTORE_PASSWORD || !process.env.RELEASE_KEY_ALIAS || !process.env.RELEASE_KEY_PASSWORD) {
  console.error(
    "Missing release signing env: RELEASE_KEYSTORE_PASSWORD, RELEASE_KEY_ALIAS, RELEASE_KEY_PASSWORD. See .env.example.",
  );
  process.exit(1);
}

if (!fs.existsSync(gradlePath)) {
  console.error(`Gradle file not found: ${gradlePath}`);
  process.exit(1);
}

let content = fs.readFileSync(gradlePath, "utf8");

if (content.includes("hd-customer-release-signing")) {
  console.log("Release signing config already present.");
  process.exit(0);
}

const releaseBlock = `
        // hd-customer-release-signing — credentials from env at build time
        release {
            storeFile file('${storeFile}')
            storePassword System.getenv("RELEASE_KEYSTORE_PASSWORD") ?: ""
            keyAlias System.getenv("RELEASE_KEY_ALIAS") ?: ""
            keyPassword System.getenv("RELEASE_KEY_PASSWORD") ?: ""
        }`;

if (!content.includes("signingConfigs {")) {
  console.error("Could not find signingConfigs block in build.gradle");
  process.exit(1);
}

content = content.replace(/(signingConfigs\s*\{)/, `$1${releaseBlock}`);

content = content.replace(
  /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/,
  "$1signingConfig signingConfigs.release",
);

fs.writeFileSync(gradlePath, content);
console.log("Release signing config injected (env-based, no passwords in file).");
