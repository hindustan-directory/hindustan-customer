import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams, router, useNavigation } from "expo-router";
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
import { MessageSquare, Package, Star } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Field } from "../../components/Field";
import { BusinessDetailActions } from "../../components/customer/business/BusinessDetailActions";
import { BusinessHeader } from "../../components/customer/business/BusinessHeader";
import { BusinessHeroSummary } from "../../components/customer/business/BusinessHeroSummary";
import { BusinessProductRow } from "../../components/customer/business/BusinessProductRow";
import { BusinessReviewRow } from "../../components/customer/business/BusinessReviewRow";
import { BusinessTabBar } from "../../components/customer/business/BusinessTabBar";
import { ReviewEditModal } from "../../components/customer/ReviewEditModal";
import { SheetModal } from "../../components/customer/SheetModal";
import { Button, ScreenState } from "../../components/ui";
import { ShimmerBusinessDetail } from "../../components/Shimmer";
import { ApiError } from "../../src/api/client";
import { customerApi } from "../../src/api/endpoints";
import type { Product, PublicReview, ReportReason } from "../../src/api/types";
import { useAuth } from "../../src/auth/AuthProvider";
import { useBusinessDetailStore, type BusinessDetailTab } from "../../src/stores/businessDetailStore";

const TAB_ORDER: BusinessDetailTab[] = ["about", "products", "reviews"];
const BOTTOM_BAR_HEIGHT = 88;

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "fake", label: "Fake listing" },
  { value: "offensive", label: "Offensive content" },
  { value: "closed", label: "Business closed" },
  { value: "wrong_info", label: "Wrong information" },
  { value: "other", label: "Other" },
];

export default function BusinessDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pagerRef = useRef<ScrollView>(null);
  const listBottomPad = BOTTOM_BAR_HEIGHT + Math.max(insets.bottom, 12);

  const vendor = useBusinessDetailStore((s) => s.vendor);
  const tab = useBusinessDetailStore((s) => s.tab);
  const loading = useBusinessDetailStore((s) => s.loading);
  const error = useBusinessDetailStore((s) => s.error);
  const isSaved = useBusinessDetailStore((s) => s.isSaved);
  const favBusy = useBusinessDetailStore((s) => s.favBusy);
  const myReview = useBusinessDetailStore((s) => s.myReview);
  const products = useBusinessDetailStore((s) => s.products);
  const productsLoaded = useBusinessDetailStore((s) => s.productsLoaded);
  const productsLoading = useBusinessDetailStore((s) => s.productsLoading);
  const reviews = useBusinessDetailStore((s) => s.reviews);
  const reviewTotalPages = useBusinessDetailStore((s) => s.reviewTotalPages);
  const currentReviewPage = useBusinessDetailStore((s) => s.reviewPage);
  const reviewsLoading = useBusinessDetailStore((s) => s.reviewsLoading);
  const setTab = useBusinessDetailStore((s) => s.setTab);
  const load = useBusinessDetailStore((s) => s.load);
  const loadMoreReviews = useBusinessDetailStore((s) => s.loadMoreReviews);
  const toggleFavourite = useBusinessDetailStore((s) => s.toggleFavourite);
  const refreshAfterReview = useBusinessDetailStore((s) => s.refreshAfterReview);
  const reset = useBusinessDetailStore((s) => s.reset);

  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    if (!slug) return;
    void load(slug, isAuthenticated);
    return () => reset();
  }, [slug, isAuthenticated, load, reset]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: vendor?.businessName ?? "Business" });
  }, [navigation, vendor?.businessName]);

  useEffect(() => {
    if (!enquiryOpen && !reviewOpen && !reportOpen) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (enquiryOpen) {
        setEnquiryOpen(false);
        return true;
      }
      if (reviewOpen) {
        setReviewOpen(false);
        return true;
      }
      if (reportOpen) {
        setReportOpen(false);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [enquiryOpen, reviewOpen, reportOpen]);

  const handleToggleFavourite = useCallback(async () => {
    const result = await toggleFavourite(isAuthenticated);
    if (result === "auth") router.push("/(auth)/login");
  }, [toggleFavourite, isAuthenticated]);

  const handleWriteReview = useCallback(() => {
    if (!isAuthenticated) {
      router.push("/(auth)/login");
      return;
    }
    setReviewOpen(true);
  }, [isAuthenticated]);

  const scrollToTab = useCallback(
    (next: BusinessDetailTab, animated = true) => {
      const index = TAB_ORDER.indexOf(next);
      if (index < 0) return;
      pagerRef.current?.scrollTo({ x: index * width, animated });
    },
    [width],
  );

  const handleTabPress = useCallback(
    (next: BusinessDetailTab) => {
      setTab(next);
      scrollToTab(next);
    },
    [setTab, scrollToTab],
  );

  const handlePagerScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / width);
      const next = TAB_ORDER[index];
      if (next && next !== tab) setTab(next);
    },
    [tab, setTab, width],
  );

  useEffect(() => {
    pagerRef.current?.scrollTo({ x: 0, animated: false });
  }, [slug]);

  useEffect(() => {
    scrollToTab(tab, false);
    // ponytail: reposition pager on rotation only; tab taps/swipes drive scroll elsewhere
    // eslint-disable-next-line react-hooks/exhaustive-deps -- width-only
  }, [width]);

  const renderProduct = useCallback(
    ({ item }: { item: Product }) => <BusinessProductRow item={item} />,
    [],
  );

  const renderReview = useCallback(
    ({ item }: { item: PublicReview }) => <BusinessReviewRow item={item} />,
    [],
  );

  const productsKeyExtractor = useCallback((item: Product) => item.id, []);
  const reviewsKeyExtractor = useCallback((item: PublicReview) => item.id, []);

  return (
    <>
      <ScreenState
        loading={loading}
        loadingShimmer={<ShimmerBusinessDetail />}
        error={error}
        onRetry={() => {
          if (slug) void load(slug, isAuthenticated);
        }}
      >
        {vendor ? (
          <View className="flex-1 bg-ink-50">
            <BusinessHeroSummary vendor={vendor} />
            <BusinessTabBar
              active={tab}
              onChange={handleTabPress}
              productCount={productsLoaded && products.length > 0 ? products.length : undefined}
              reviewCount={vendor.reviewCount || undefined}
            />

            <ScrollView
              ref={pagerRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              bounces={false}
              decelerationRate="fast"
              onMomentumScrollEnd={handlePagerScrollEnd}
              scrollEventThrottle={16}
              className="flex-1"
            >
              <View style={{ width }} className="flex-1">
                <ScrollView
                  className="flex-1"
                  nestedScrollEnabled
                  contentContainerStyle={{ paddingBottom: listBottomPad }}
                >
                  <BusinessHeader
                    vendor={vendor}
                    isAuthenticated={isAuthenticated}
                    onReport={() => setReportOpen(true)}
                  />
                </ScrollView>
              </View>

              <View style={{ width }} className="flex-1">
                <FlashList
                  className="flex-1"
                  data={products}
                  keyExtractor={productsKeyExtractor}
                  contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: listBottomPad }}
                  ListEmptyComponent={
                    productsLoading ? (
                      <Text className="py-16 text-center text-sm text-ink-500">Loading products…</Text>
                    ) : (
                      <View className="items-center px-4 py-16">
                        <Package size={40} color="#94A3B8" strokeWidth={1.75} />
                        <Text className="mt-3 text-center text-base font-medium text-ink-700">
                          No products listed yet
                        </Text>
                        <Text className="mt-1 text-center text-sm text-ink-500">
                          Check back later or send an enquiry.
                        </Text>
                      </View>
                    )
                  }
                  renderItem={renderProduct}
                />
              </View>

              <View style={{ width }} className="flex-1">
                <FlashList
                  className="flex-1"
                  data={reviews}
                  keyExtractor={reviewsKeyExtractor}
                  contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: listBottomPad }}
                  onEndReached={() => void loadMoreReviews()}
                  onEndReachedThreshold={0.4}
                  ListHeaderComponent={
                    <Pressable
                      className="mb-4 flex-row items-center justify-between rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3.5 active:bg-brand-100"
                      onPress={handleWriteReview}
                    >
                      <View className="flex-row items-center gap-2.5">
                        <View className="h-9 w-9 items-center justify-center rounded-full bg-white">
                          <Star size={18} color="#2563EB" strokeWidth={2} />
                        </View>
                        <View>
                          <Text className="text-sm font-semibold text-ink-900">
                            {myReview ? "Update your review" : "Share your experience"}
                          </Text>
                          <Text className="text-xs text-ink-500">Help others choose wisely</Text>
                        </View>
                      </View>
                      <Text className="text-sm font-bold text-brand-600">
                        {myReview ? "Edit" : "Write"}
                      </Text>
                    </Pressable>
                  }
                  ListEmptyComponent={
                    reviewsLoading ? (
                      <Text className="py-16 text-center text-sm text-ink-500">Loading reviews…</Text>
                    ) : (
                      <View className="items-center px-4 py-10">
                        <MessageSquare size={40} color="#94A3B8" strokeWidth={1.75} />
                        <Text className="mt-3 text-center text-base font-medium text-ink-700">
                          No reviews yet
                        </Text>
                        <Text className="mt-1 text-center text-sm text-ink-500">
                          Be the first to review this business.
                        </Text>
                      </View>
                    )
                  }
                  ListFooterComponent={
                    currentReviewPage < reviewTotalPages ? (
                      <Button
                        label={reviewsLoading ? "Loading…" : "Load more reviews"}
                        variant="outline"
                        disabled={reviewsLoading}
                        className="mt-2"
                        onPress={() => void loadMoreReviews()}
                      />
                    ) : null
                  }
                  renderItem={renderReview}
                />
              </View>
            </ScrollView>

            <BusinessDetailActions
              isSaved={isSaved}
              favBusy={favBusy}
              onEnquire={() => setEnquiryOpen(true)}
              onBook={() =>
                router.push({
                  pathname: "/bookings/new",
                  params: { vendorId: vendor.id, name: vendor.businessName },
                })
              }
              onToggleFavourite={() => void handleToggleFavourite()}
            />
          </View>
        ) : null}
      </ScreenState>

      {vendor ? (
        <>
          <EnquiryModal
            visible={enquiryOpen}
            vendorId={vendor.id}
            onClose={() => setEnquiryOpen(false)}
          />
          <ReviewEditModal
            visible={reviewOpen}
            vendorId={vendor.id}
            businessName={vendor.businessName}
            existingReview={myReview}
            onClose={() => setReviewOpen(false)}
            onSaved={() => void refreshAfterReview(isAuthenticated)}
          />
          <ReportModal
            visible={reportOpen}
            vendorId={vendor.id}
            onClose={() => setReportOpen(false)}
          />
        </>
      ) : null}
    </>
  );
}

function EnquiryModal({
  visible,
  vendorId,
  onClose,
}: {
  visible: boolean;
  vendorId: string;
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
    setMessage("");
    setDone(false);
    setError(null);
    setFieldErrors({});
    setName(user?.fullName ?? "");
    setPhone(user?.phone ?? "");
  }, [visible, user?.fullName, user?.phone]);

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
              <Field label="Name" value={name} onChangeText={setName} error={fieldErrors.name} autoCapitalize="words" />
              <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={fieldErrors.phone} />
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

function ReportModal({
  visible,
  vendorId,
  onClose,
}: {
  visible: boolean;
  vendorId: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<ReportReason>("wrong_info");
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      await customerApi.report({
        vendorId,
        reason,
        details: details.trim() || undefined,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not submit report");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SheetModal visible={visible} title="Report business" onClose={onClose}>
      {done ? (
        <>
          <Text className="mb-4 text-ink-700">Thanks — our team will review this report.</Text>
          <Button label="Close" onPress={onClose} />
        </>
      ) : (
        <>
          <Text className="mb-2 text-sm font-medium text-ink-700">Reason</Text>
          <View className="mb-3 flex-row flex-wrap gap-2">
            {REPORT_REASONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => setReason(option.value)}
                className={`rounded-full px-3 py-1.5 ${
                  reason === option.value ? "bg-brand-600" : "bg-ink-100"
                }`}
              >
                <Text
                  className={`text-sm ${
                    reason === option.value ? "font-semibold text-white" : "text-ink-700"
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text className="mb-1.5 text-sm font-medium text-ink-700">Details (optional)</Text>
          <TextInput
            value={details}
            onChangeText={setDetails}
            multiline
            textAlignVertical="top"
            placeholderTextColor="#94A3B8"
            className="mb-3 min-h-[80px] rounded-xl border border-ink-200 bg-ink-50 px-4 py-3 text-base text-ink-900"
          />
          {error ? <Text className="mb-2 text-sm text-red-600">{error}</Text> : null}
          <Button label="Submit report" onPress={() => void submit()} loading={loading} />
          <Button label="Cancel" variant="outline" className="mt-2" onPress={onClose} />
        </>
      )}
    </SheetModal>
  );
}
