import { Image } from "expo-image";
import { MapPin, Phone, Star } from "lucide-react-native";
import { memo } from "react";
import { Text, View } from "react-native";
import type { Vendor } from "../../../src/api/types";
import { formatPriceRange } from "../../../src/lib/money";
import { openTel, openWhatsApp } from "../../../src/lib/phone";
import { openSafeExternalUrl } from "../../../src/lib/safeLinking";
import { formatRating } from "../../BusinessCard";
import { Button } from "../../ui";
import { AccentPill } from "../AccentCard";
import { WhatsAppIcon } from "../BrandIcons";

type Props = {
  vendor: Vendor;
};

export const BusinessHeroSummary = memo(function BusinessHeroSummary({ vendor }: Props) {
  const hero = vendor.coverBannerUrl ?? vendor.photos?.[0]?.imageUrl ?? null;
  const priceRange = formatPriceRange(vendor.priceRangeMin ?? null, vendor.priceRangeMax ?? null);
  const accentKey = vendor.category?.name || vendor.slug;
  const hasContact = !!(vendor.phone || vendor.whatsappNumber || vendor.googleMapLink);

  return (
    <View className="bg-white">
      <View className="relative h-36 bg-brand-100">
        {hero ? (
          <Image source={{ uri: hero }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
        ) : null}
        <View className="absolute inset-x-0 bottom-0 h-20 bg-black/25" />
        {vendor.logoUrl ? (
          <View className="absolute -bottom-7 left-5 h-14 w-14 overflow-hidden rounded-2xl border-2 border-white bg-white shadow-md">
            <Image
              source={{ uri: vendor.logoUrl }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          </View>
        ) : null}
      </View>

      <View className={`px-5 pb-4 ${vendor.logoUrl ? "pt-9" : "pt-4"}`}>
        <Text className="text-xl font-bold text-ink-900" numberOfLines={2}>
          {vendor.businessName}
        </Text>
        <View className="mt-2 flex-row flex-wrap items-center gap-2">
          {vendor.category?.name ? (
            <AccentPill accentKey={accentKey} label={vendor.category.name} />
          ) : null}
          {vendor.city ? (
            <View className="flex-row items-center gap-1">
              <MapPin size={12} color="#64748B" strokeWidth={2.25} />
              <Text className="text-xs font-medium text-ink-600">{vendor.city}</Text>
            </View>
          ) : null}
        </View>

        <View className="mt-2.5 flex-row flex-wrap items-center gap-2">
          <View className="flex-row items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1">
            <Star size={14} color="#F59E0B" fill="#F59E0B" strokeWidth={0} />
            <Text className="text-sm font-semibold text-amber-900">
              {formatRating(vendor.avgRating)}
            </Text>
            <Text className="text-xs text-amber-800/80">({vendor.reviewCount})</Text>
          </View>
          {priceRange ? (
            <Text className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
              {priceRange}
            </Text>
          ) : null}
          {vendor.is24x7 ? (
            <Text className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
              Open 24×7
            </Text>
          ) : null}
          {vendor.hasEmergencyService ? (
            <Text className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
              Emergency
            </Text>
          ) : null}
        </View>

        {hasContact ? (
          <View className="mt-4 flex-row gap-2">
            {vendor.phone ? (
              <Button
                label="Call"
                icon={Phone}
                className="min-w-0 flex-1 py-3"
                onPress={() => openTel(vendor.phone!)}
              />
            ) : null}
            {vendor.whatsappNumber ? (
              <Button
                label="WhatsApp"
                variant="secondary"
                iconNode={<WhatsAppIcon size={18} color="#25D366" />}
                className="min-w-0 flex-[1.35] px-4 py-3"
                onPress={() => openWhatsApp(vendor.whatsappNumber!)}
              />
            ) : null}
            {vendor.googleMapLink ? (
              <Button
                label="Map"
                variant="outline"
                iconNode={<MapPin size={18} color="#E11D48" strokeWidth={2} />}
                className="min-w-0 flex-1 border-rose-100 bg-rose-50 py-3"
                onPress={() => openSafeExternalUrl(vendor.googleMapLink!)}
              />
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
});
