import { Image } from "expo-image";
import { cssInterop } from "nativewind";

/**
 * NativeWind v4 does not auto-map third-party components, so `className` on
 * expo-image's `Image` (width/height/rounded/aspect-ratio/etc.) is silently
 * dropped — the image then has 0 size and never appears. Registering it once
 * here maps `className` → `style` for every `<Image>` app-wide.
 *
 * Import this for its side effect once, as early as possible (root layout).
 */
cssInterop(Image, { className: "style" });
