import { Image } from "expo-image";
import { router, Stack, useLocalSearchParams } from "expo-router";
import {
  ExternalLink,
  Heart,
  MapPin,
  Phone,
  Star,
} from "lucide-react-native";
import {
  LinkIconButton,
  SOCIAL_BRAND_ICONS,
  WhatsAppIcon,
} from "../../components/customer/BrandIcons";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  BackHandler,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Field } from "../../components/Field";
import { formatRating } from "../../components/BusinessCard";
import { ReviewEditModal } from "../../components/customer/ReviewEditModal";
import { SheetModal } from "../../components/customer/SheetModal";
import { Button, ScreenState } from "../../components/ui";
import { ApiError } from "../../src/api/client";
import { customerApi, directoryApi } from "../../src/api/endpoints";
import type {
  CustomerReview,
  Product,
  PublicReview,
  ReportReason,
  Vendor,
} from "../../src/api/types";
import { useAuth } from "../../src/auth/AuthProvider";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "fake", label: "Fake listing" },
  { value: "offensive", label: "Offensive content" },
  { value: "closed", label: "Business closed" },
  { value: "wrong_info", label: "Wrong information" },
  { value: "other", label: "Other" },
];

function formatPriceRange(min: string | null, max: string | null): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null) return `₹${min} – ₹${max}`;
  if (min != null) return `From ₹${min}`;
  return `Up to ₹${max}`;
}

function openExternalUrl(url: string) {
  void Linking.openURL(url).catch(() => undefined);
}

function whatsAppUrl(number: string) {
  return `https://wa.me/${number.replace(/\D/g, "")}`;
}

export default function BusinessDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotalPages, setReviewTotalPages] = useState(1);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favBusy, setFavBusy] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [myReview, setMyReview] = useState<CustomerReview | null>(null);

  const load = useCallback(async () => {
    if (!slug) return;
    setError(null);
    try {
      const [biz, rev, prod] = await Promise.all([
        directoryApi.business(slug),
        directoryApi.reviews(slug, 1, 10),
        directoryApi.products(slug, { page: 1, pageSize: 20 }),
      ]);
      setVendor(biz);
      setReviews(rev.items);
      setReviewPage(1);
      setReviewTotalPages(rev.totalPages);
      setProducts(prod.items);

      if (isAuthenticated) {
        try {
          const [favs, mine] = await Promise.all([
            customerApi.favourites(1, 100),
            customerApi.listReviews(1, 100),
          ]);
          setIsSaved(favs.items.some((row) => row.vendor.id === biz.id));
          setMyReview(mine.items.find((row) => row.vendorId === biz.id) ?? null);
        } catch {
          // Favourite/review status is optional chrome — don't fail the page.
          setMyReview(null);
        }
      } else {
        setIsSaved(false);
        setMyReview(null);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Business not found");
    } finally {
      setLoading(false);
    }
  }, [slug, isAuthenticated]);

  async function loadMoreReviews() {
    if (!slug || reviewPage >= reviewTotalPages || reviewsLoading) return;
    setReviewsLoading(true);
    try {
      const nextPage = reviewPage + 1;
      const rev = await directoryApi.reviews(slug, nextPage, 10);
      setReviews((prev) => [...prev, ...rev.items]);
      setReviewPage(nextPage);
      setReviewTotalPages(rev.totalPages);
    } catch {
    } finally {
      setReviewsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [load]);

  // System back dismisses enquiry/review/report modal before popping the screen.
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

  async function toggleFavourite() {
    if (!vendor) return;
    if (!isAuthenticated) {
      router.push("/(auth)/login");
      return;
    }
    setFavBusy(true);
    setError(null);
    try {
      if (isSaved) {
        await customerApi.removeFavourite(vendor.id);
        setIsSaved(false);
      } else {
        await customerApi.addFavourite(vendor.id);
        setIsSaved(true);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Favourite failed");
    } finally {
      setFavBusy(false);
    }
  }

  function handleWriteReview() {
    if (!isAuthenticated) {
      router.push("/(auth)/login");
      return;
    }
    setReviewOpen(true);
  }

  const hero =
    vendor?.coverBannerUrl ?? vendor?.photos?.[0]?.imageUrl ?? null;
  const priceRange = vendor
    ? formatPriceRange(vendor.priceRangeMin ?? null, vendor.priceRangeMax ?? null)
    : null;
  const socialEntries = vendor?.socialLinks
    ? SOCIAL_BRAND_ICONS.filter(({ key }) => !!vendor.socialLinks?.[key])
    : [];
  const hasContactLinks =
    !!vendor?.phone || !!vendor?.whatsappNumber || !!vendor?.googleMapLink || !!vendor?.website;

  return (
    <>
      <Stack.Screen options={{ title: vendor?.businessName ?? "Business" }} />
      <ScreenState loading={loading} error={error} onRetry={() => { setLoading(true); void load(); }}>
        {vendor ? (
          <ScrollView className="flex-1 bg-ink-50" contentContainerClassName="pb-10">
            <View className="relative h-52 bg-brand-100">
              {hero ? (
                <Image source={{ uri: hero }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
              ) : null}
              {vendor.logoUrl ? (
                <View className="absolute -bottom-8 left-5 h-16 w-16 overflow-hidden rounded-2xl border-2 border-white bg-white shadow-sm">
                  <Image
                    source={{ uri: vendor.logoUrl }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                </View>
              ) : null}
            </View>
            <View className={`bg-white px-5 pb-4 ${vendor.logoUrl ? "pt-10" : "pt-4"}`}>
              <Text className="text-2xl font-bold text-ink-900">{vendor.businessName}</Text>
              <Text className="mt-1 text-sm text-ink-500">
                {vendor.category?.name ?? "Business"}
                {vendor.city ? ` · ${vendor.city}` : ""}
              </Text>
              <View className="mt-2 flex-row flex-wrap items-center gap-2">
                <View className="flex-row items-center gap-1.5">
                  <Star size={16} color="#1D4ED8" fill="#1D4ED8" strokeWidth={0} />
                  <Text className="text-base text-brand-700">
                    {formatRating(vendor.avgRating)} ({vendor.reviewCount} reviews)
                  </Text>
                </View>
                {priceRange ? (
                  <Text className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                    {priceRange}
                  </Text>
                ) : null}
                {vendor.is24x7 ? (
                  <Text className="rounded-full bg-ink-100 px-2.5 py-0.5 text-xs font-semibold text-ink-700">
                    Open 24×7
                  </Text>
                ) : null}
                {vendor.hasEmergencyService ? (
                  <Text className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                    Emergency
                  </Text>
                ) : null}
              </View>
              {vendor.description ? (
                <Text className="mt-3 text-sm leading-5 text-ink-700">{vendor.description}</Text>
              ) : null}
              {(vendor.addressLine || vendor.city) && (
                <Text className="mt-3 text-sm text-ink-500">
                  {[vendor.addressLine, vendor.city, vendor.state, vendor.pincode]
                    .filter(Boolean)
                    .join(", ")}
                </Text>
              )}
              {vendor.brandsAvailable?.length ? (
                <Text className="mt-2 text-sm text-ink-500">
                  Brands: {vendor.brandsAvailable.join(", ")}
                </Text>
              ) : null}
              <View className="mt-4 flex-row flex-wrap gap-2">
                <Button label="Enquire" className="flex-1" onPress={() => setEnquiryOpen(true)} />
                <Button
                  label="Book"
                  variant="secondary"
                  className="flex-1"
                  onPress={() =>
                    router.push({
                      pathname: "/bookings/new",
                      params: { vendorId: vendor.id, name: vendor.businessName },
                    })
                  }
                />
                <Button
                  label={isSaved ? "Saved" : "Save"}
                  variant="outline"
                  icon={Heart}
                  iconFilled={isSaved}
                  loading={favBusy}
                  onPress={() => void toggleFavourite()}
                />
              </View>
              <Pressable className="mt-2 py-1" onPress={() => {
                if (!isAuthenticated) {
                  router.push("/(auth)/login");
                  return;
                }
                setReportOpen(true);
              }}>
                <Text className="text-sm text-ink-400">Report this business</Text>
              </Pressable>
              {hasContactLinks ? (
                <View className="mt-4 flex-row flex-wrap gap-3">
                  {vendor.phone ? (
                    <LinkIconButton
                      accessibilityLabel={`Call ${vendor.phone}`}
                      onPress={() => openExternalUrl(`tel:${vendor.phone}`)}
                    >
                      <Phone size={20} color="#2563EB" strokeWidth={2} />
                    </LinkIconButton>
                  ) : null}
                  {vendor.whatsappNumber ? (
                    <LinkIconButton
                      accessibilityLabel={`WhatsApp ${vendor.whatsappNumber}`}
                      className="bg-emerald-50"
                      onPress={() => openExternalUrl(whatsAppUrl(vendor.whatsappNumber!))}
                    >
                      <WhatsAppIcon size={22} />
                    </LinkIconButton>
                  ) : null}
                  {vendor.googleMapLink ? (
                    <LinkIconButton
                      accessibilityLabel="Open in Maps"
                      className="bg-rose-50"
                      onPress={() => openExternalUrl(vendor.googleMapLink!)}
                    >
                      <MapPin size={20} color="#E11D48" strokeWidth={2} />
                    </LinkIconButton>
                  ) : null}
                  {vendor.website ? (
                    <LinkIconButton
                      accessibilityLabel="Visit website"
                      onPress={() => openExternalUrl(vendor.website!)}
                    >
                      <ExternalLink size={20} color="#2563EB" strokeWidth={2} />
                    </LinkIconButton>
                  ) : null}
                </View>
              ) : null}
            </View>

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
                      {DAY_NAMES[h.dayOfWeek] ?? h.dayOfWeek}:{" "}
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

            <Section title="Products">
              {products.length === 0 ? (
                <Text className="text-sm text-ink-500">No products listed</Text>
              ) : (
                products.map((p) => (
                  <View key={p.id} className="mb-3 flex-row justify-between border-b border-ink-100 pb-2">
                    <View className="flex-1 pr-3">
                      <Text className="font-medium text-ink-900">{p.name}</Text>
                      {p.description ? (
                        <Text className="text-xs text-ink-500" numberOfLines={2}>
                          {p.description}
                        </Text>
                      ) : null}
                    </View>
                    <Text className="text-sm font-semibold text-ink-900">
                      {p.price != null ? `₹${p.price}` : p.availability.replace(/_/g, " ")}
                    </Text>
                  </View>
                ))
              )}
            </Section>

            <Section
              title="Reviews"
              actionLabel={myReview ? "Edit review" : "Write review"}
              onAction={handleWriteReview}
            >
              {reviews.length === 0 ? (
                <Text className="text-sm text-ink-500">No reviews yet</Text>
              ) : (
                reviews.map((r) => (
                  <View key={r.id} className="mb-3 border-b border-ink-100 pb-2">
                    <View className="flex-row items-center gap-1.5">
                      <Star size={14} color="#1D4ED8" fill="#1D4ED8" strokeWidth={0} />
                      <Text className="font-medium text-ink-900">
                        {r.rating} · {r.customerName}
                      </Text>
                    </View>
                    {r.comment ? <Text className="mt-1 text-sm text-ink-600">{r.comment}</Text> : null}
                  </View>
                ))
              )}
              {reviewPage < reviewTotalPages ? (
                <Button
                  label={reviewsLoading ? "Loading…" : "Load more reviews"}
                  variant="outline"
                  disabled={reviewsLoading}
                  onPress={() => void loadMoreReviews()}
                />
              ) : null}
            </Section>
          </ScrollView>
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
            onSaved={() => void load()}
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

function Section({
  title,
  children,
  actionLabel,
  onAction,
}: {
  title: string;
  children: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="mx-5 mt-4 overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-sm">
      <View className="px-4 py-4">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-lg font-semibold text-ink-900">{title}</Text>
          {actionLabel && onAction ? (
            <Pressable onPress={onAction}>
              <Text className="text-sm text-brand-600">{actionLabel}</Text>
            </Pressable>
          ) : null}
        </View>
        {children}
      </View>
    </View>
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
