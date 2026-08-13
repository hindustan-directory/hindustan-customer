import { Image } from "expo-image";
import { router } from "expo-router";
import { ExternalLink } from "lucide-react-native";
import { memo, type ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { openSafeExternalUrl } from "../../../src/lib/safeLinking";
import {
  LinkIconButton,
  SOCIAL_BRAND_ICONS,
} from "../BrandIcons";
import { DAY_LABELS } from "../../../src/lib/datetime";
import type { Vendor } from "../../../src/api/types";

function openExternalUrl(url: string) {
  openSafeExternalUrl(url);
}

type Props = {
  vendor: Vendor;
  isAuthenticated: boolean;
  onReport: () => void;
};

export const BusinessHeader = memo(function BusinessHeader({
  vendor,
  isAuthenticated,
  onReport,
}: Props) {
  const socialEntries = vendor.socialLinks
    ? SOCIAL_BRAND_ICONS.filter(({ key }) => !!vendor.socialLinks?.[key])
    : [];

  return (
    <View className="px-5 pb-6 pt-2">
      {vendor.description ? (
        <View className="mb-4 overflow-hidden rounded-3xl border border-ink-100 bg-white px-4 py-4 shadow-sm">
          <Text className="mb-2 text-sm font-semibold text-ink-900">About</Text>
          <Text className="text-sm leading-6 text-ink-700">{vendor.description}</Text>
        </View>
      ) : null}

      {(vendor.addressLine || vendor.city) && (
        <View className="mb-4 overflow-hidden rounded-3xl border border-ink-100 bg-white px-4 py-4 shadow-sm">
          <Text className="mb-1.5 text-sm font-semibold text-ink-900">Address</Text>
          <Text className="text-sm leading-5 text-ink-600">
            {[vendor.addressLine, vendor.city, vendor.state, vendor.pincode]
              .filter(Boolean)
              .join(", ")}
          </Text>
        </View>
      )}

      {vendor.brandsAvailable?.length ? (
        <View className="mb-4 overflow-hidden rounded-3xl border border-ink-100 bg-white px-4 py-4 shadow-sm">
          <Text className="mb-1.5 text-sm font-semibold text-ink-900">Brands</Text>
          <Text className="text-sm leading-5 text-ink-600">{vendor.brandsAvailable.join(", ")}</Text>
        </View>
      ) : null}

      {vendor.website ? (
        <Pressable
          className="mb-4 flex-row items-center justify-between overflow-hidden rounded-3xl border border-ink-100 bg-white px-4 py-4 shadow-sm active:bg-ink-50"
          onPress={() => openExternalUrl(vendor.website!)}
        >
          <View>
            <Text className="text-sm font-semibold text-ink-900">Website</Text>
            <Text className="mt-0.5 text-xs text-brand-600" numberOfLines={1}>
              Visit online
            </Text>
          </View>
          <ExternalLink size={20} color="#2563EB" strokeWidth={2} />
        </Pressable>
      ) : null}

      {socialEntries.length > 0 ? (
        <Section title="Social">
          <View className="flex-row flex-wrap gap-3">
            {socialEntries.map(({ key, label, Icon, wrap }) => (
              <LinkIconButton
                key={key}
                accessibilityLabel={label}
                className={wrap}
                onPress={() => openExternalUrl(vendor.socialLinks![key]!)}
              >
                <Icon size={22} />
              </LinkIconButton>
            ))}
          </View>
        </Section>
      ) : null}

      {vendor.hours && vendor.hours.length > 0 ? (
        <Section title="Hours">
          {vendor.is24x7 ? (
            <Text className="mb-2 text-sm font-medium text-ink-700">Open 24 hours every day</Text>
          ) : null}
          {vendor.hours
            .slice()
            .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
            .map((h) => (
              <Text key={h.id} className="mb-1 text-sm text-ink-700">
                {DAY_LABELS[h.dayOfWeek] ?? h.dayOfWeek}:{" "}
                {h.isClosed
                  ? "Closed"
                  : `${h.opensAt?.slice(0, 5) ?? "—"} – ${h.closesAt?.slice(0, 5) ?? "—"}`}
              </Text>
            ))}
        </Section>
      ) : vendor.is24x7 ? (
        <Section title="Hours">
          <Text className="text-sm text-ink-700">Open 24 hours every day</Text>
        </Section>
      ) : null}

      {vendor.photos && vendor.photos.length > 0 ? (
        <Section title="Photos">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
            {vendor.photos.map((photo) => (
              <View key={photo.id} className="mx-1 h-28 w-36 overflow-hidden rounded-xl bg-ink-100">
                <Image
                  source={{ uri: photo.imageUrl }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              </View>
            ))}
          </ScrollView>
        </Section>
      ) : null}

      {vendor.catalogues && vendor.catalogues.length > 0 ? (
        <Section title="Catalogues & brochures">
          {vendor.catalogues.map((doc) => (
            <Pressable
              key={doc.id}
              className="mb-2 flex-row items-center justify-between border-b border-ink-100 pb-2"
              onPress={() => openExternalUrl(doc.fileUrl)}
            >
              <View className="flex-1 pr-3">
                <Text className="font-medium text-ink-900" numberOfLines={1}>
                  {doc.fileName}
                </Text>
                <Text className="text-xs capitalize text-ink-500">
                  {(doc.kind ?? "catalogue").replace(/_/g, " ")}
                </Text>
              </View>
              <ExternalLink size={16} color="#2563EB" strokeWidth={2} />
            </Pressable>
          ))}
        </Section>
      ) : null}

      <Pressable
        className="mt-2 items-center py-2"
        onPress={() => {
          if (!isAuthenticated) {
            router.push("/(auth)/login");
            return;
          }
          onReport();
        }}
      >
        <Text className="text-sm text-ink-400">Report this business</Text>
      </Pressable>
    </View>
  );
});

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="mb-4 overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-sm">
      <View className="px-4 py-4">
        <Text className="mb-3 text-lg font-semibold text-ink-900">{title}</Text>
        {children}
      </View>
    </View>
  );
}
