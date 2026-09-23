import { Image } from "expo-image";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { ChevronRight, MessageSquare, Package, Store } from "lucide-react-native";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  BackHandler,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Field } from "../../components/Field";
import { SheetModal } from "../../components/customer/SheetModal";
import { Button, ScreenState } from "../../components/ui";
import { ShimmerDetail } from "../../components/Shimmer";
import { ApiError } from "../../src/api/client";
import { customerApi, directoryApi } from "../../src/api/endpoints";
import type { ProductAvailability, PublicProductDetail } from "../../src/api/types";
import { useAuth } from "../../src/auth/AuthProvider";

const BOTTOM_BAR_HEIGHT = 84;

const AVAILABILITY: Record<ProductAvailability, { label: string; tone: string }> = {
  in_stock: { label: "In stock", tone: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  out_of_stock: { label: "Out of stock", tone: "border-amber-200 bg-amber-50 text-amber-700" },
  discontinued: { label: "Discontinued", tone: "border-ink-200 bg-ink-100 text-ink-600" },
};

export default function ProductDetailScreen() {
  // `name` is passed by the catalogue row so the header title shows instantly
  // before the fetch resolves; deep links only have `id` and fall back to it.
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [product, setProduct] = useState<PublicProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setError("Product not found");
      return;
    }
    setError(null);
    try {
      const data = await directoryApi.product(id);
      if (!mounted.current) return;
      setProduct(data);
    } catch (err) {
      if (!mounted.current) return;
      // 404 covers a removed product or a vendor that's no longer approved.
      if (err instanceof ApiError && err.status === 404) {
        setError("This product is no longer available");
      } else {
        setError(err instanceof ApiError ? err.message : "Could not load product");
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: product?.name ?? name ?? "Product" });
  }, [navigation, product?.name, name]);

  // Close the enquiry sheet on Android back before popping the screen.
  useEffect(() => {
    if (!enquiryOpen) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      setEnquiryOpen(false);
      return true;
    });
    return () => sub.remove();
  }, [enquiryOpen]);

  const onCarouselScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / width);
      setActiveImage(index);
    },
    [width],
  );

  const images = product?.images ?? [];
  const availability = product ? AVAILABILITY[product.availability] : null;
  const priceLabel = product?.price != null ? `₹${product.price}` : null;
  const business = product?.business ?? null;
  const listBottomPad = BOTTOM_BAR_HEIGHT + Math.max(insets.bottom, 12);

  return (
    <>
      <ScreenState
        loading={loading}
        loadingShimmer={<ShimmerDetail />}
        error={error}
        onRetry={() => {
          setLoading(true);
          void load();
        }}
      >
        {product ? (
          <View className="flex-1 bg-ink-50">
            <ScrollView
              className="flex-1"
              contentContainerStyle={{ paddingBottom: listBottomPad }}
              showsVerticalScrollIndicator={false}
            >
              {images.length > 0 ? (
                <View>
                  <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={onCarouselScroll}
                    scrollEventThrottle={16}
                  >
                    {images.map((img) => (
                      <Image
                        key={img.id}
                        source={{ uri: img.imageUrl }}
                        style={{ width, height: width }}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        transition={150}
                        recyclingKey={img.id}
                      />
                    ))}
                  </ScrollView>
                  {images.length > 1 ? (
                    <View className="absolute bottom-3 w-full flex-row items-center justify-center gap-1.5">
                      {images.map((img, i) => (
                        <View
                          key={img.id}
                          className={`h-1.5 rounded-full ${
                            i === activeImage ? "w-4 bg-white" : "w-1.5 bg-white/60"
                          }`}
                        />
                      ))}
                    </View>
                  ) : null}
                </View>
              ) : (
                <View
                  style={{ height: width * 0.6 }}
                  className="items-center justify-center bg-ink-100"
                >
                  <Package size={48} color="#94A3B8" strokeWidth={1.5} />
                  <Text className="mt-2 text-sm text-ink-400">No photo</Text>
                </View>
              )}

              <View className="px-5 pt-5">
                <View className="flex-row items-start justify-between gap-3">
                  <Text className="min-w-0 flex-1 text-2xl font-bold text-ink-900">
                    {product.name}
                  </Text>
                  {priceLabel ? (
                    <Text className="text-2xl font-bold text-brand-600">{priceLabel}</Text>
                  ) : null}
                </View>

                <View className="mt-3 flex-row flex-wrap items-center gap-2">
                  {availability ? (
                    <View className={`rounded-full border px-2.5 py-1 ${availability.tone}`}>
                      <Text className="text-[11px] font-bold">{availability.label}</Text>
                    </View>
                  ) : null}
                  {product.category?.name ? (
                    <View className="rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1">
                      <Text className="text-[11px] font-bold uppercase tracking-wide text-brand-600">
                        {product.category.name}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {product.description ? (
                  <View className="mt-5">
                    <Text className="mb-1 text-sm font-bold uppercase tracking-wide text-ink-400">
                      Description
                    </Text>
                    <Text className="text-base leading-6 text-ink-700">
                      {product.description}
                    </Text>
                  </View>
                ) : null}

                {business ? (
                  <Pressable
                    onPress={() =>
                      router.navigate({
                        pathname: "/business/[slug]",
                        params: { slug: business.slug },
                      })
                    }
                    className="mt-6 flex-row items-center justify-between rounded-2xl border border-ink-100 bg-white px-4 py-3.5 active:bg-ink-50"
                  >
                    <View className="min-w-0 flex-1 flex-row items-center gap-2.5">
                      {business.logoUrl ? (
                        <Image
                          source={{ uri: business.logoUrl }}
                          style={{ width: 36, height: 36 }}
                          className="rounded-full bg-ink-100"
                          contentFit="cover"
                          cachePolicy="memory-disk"
                        />
                      ) : (
                        <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-50">
                          <Store size={18} color="#2563EB" strokeWidth={2} />
                        </View>
                      )}
                      <View className="min-w-0 flex-1">
                        <Text className="text-xs text-ink-500">Sold by</Text>
                        <Text className="text-sm font-semibold text-ink-900" numberOfLines={1}>
                          {business.businessName}
                          {business.city ? ` · ${business.city}` : ""}
                        </Text>
                      </View>
                    </View>
                    <ChevronRight size={18} color="#94A3B8" />
                  </Pressable>
                ) : null}
              </View>
            </ScrollView>

            <View
              className="absolute inset-x-0 bottom-0 border-t border-ink-100 bg-white px-5 pt-3"
              style={{ paddingBottom: Math.max(insets.bottom, 12) }}
            >
              <Button
                label="Enquire about this product"
                icon={MessageSquare}
                onPress={() => setEnquiryOpen(true)}
              />
            </View>
          </View>
        ) : null}
      </ScreenState>

      {product ? (
        <ProductEnquiryModal
          visible={enquiryOpen}
          vendorId={product.vendorId}
          productName={product.name}
          onClose={() => setEnquiryOpen(false)}
        />
      ) : null}
    </>
  );
}

function ProductEnquiryModal({
  visible,
  vendorId,
  productName,
  onClose,
}: {
  visible: boolean;
  vendorId: string;
  productName: string;
  onClose: () => void;
}) {
  const { isAuthenticated, user } = useAuth();
  const [name, setName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setMessage(`Hi, I'm interested in "${productName}". Is it available?`);
    setDone(false);
    setError(null);
    setFieldErrors({});
    setName(user?.fullName ?? "");
    setPhone(user?.phone ?? "");
  }, [visible, productName, user?.fullName, user?.phone]);

  async function submit() {
    setError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      if (isAuthenticated) {
        await customerApi.createEnquiryAuthed({
          vendorId,
          message: message.trim() || undefined,
        });
      } else {
        await customerApi.createEnquiryGuest({
          vendorId,
          name: name.trim(),
          phone: phone.trim(),
          message: message.trim() || undefined,
        });
      }
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError) {
        const next: Record<string, string> = {};
        for (const [k, v] of Object.entries(err.fieldErrors)) next[k] = v[0] ?? err.message;
        setFieldErrors(next);
        setError(Object.keys(next).length ? null : err.message);
      } else setError("Could not send enquiry");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SheetModal visible={visible} title="Send enquiry" onClose={onClose}>
      {done ? (
        <>
          <Text className="mb-4 text-ink-700">Enquiry sent.</Text>
          <Button label="Close" onPress={onClose} />
        </>
      ) : (
        <>
          {!isAuthenticated ? (
            <>
              <Field
                label="Name"
                value={name}
                onChangeText={setName}
                error={fieldErrors.name}
                autoCapitalize="words"
              />
              <Field
                label="Phone"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                error={fieldErrors.phone}
              />
            </>
          ) : null}
          <Text className="mb-1.5 text-sm font-medium text-ink-700">Message</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="What would you like to ask?"
            placeholderTextColor="#94A3B8"
            multiline
            textAlignVertical="top"
            className="mb-3 min-h-[100px] rounded-xl border border-ink-200 bg-ink-50 px-4 py-3 text-base text-ink-900"
          />
          {error ? <Text className="mb-2 text-sm text-red-600">{error}</Text> : null}
          <Button label="Send" onPress={() => void submit()} loading={loading} />
          <Button label="Cancel" variant="outline" className="mt-2" onPress={onClose} />
        </>
      )}
    </SheetModal>
  );
}
