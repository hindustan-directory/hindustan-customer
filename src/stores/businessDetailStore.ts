import { create } from "zustand";
import { ApiError } from "../api/client";
import { customerApi, directoryApi } from "../api/endpoints";
import type {
  CustomerReview,
  Product,
  PublicReview,
  Vendor,
} from "../api/types";

export type BusinessDetailTab = "about" | "products" | "reviews";

type BusinessDetailState = {
  slug: string | null;
  tab: BusinessDetailTab;
  vendor: Vendor | null;
  loading: boolean;
  error: string | null;
  isSaved: boolean;
  favBusy: boolean;
  myReview: CustomerReview | null;
  products: Product[];
  productsLoaded: boolean;
  productsLoading: boolean;
  reviews: PublicReview[];
  reviewPage: number;
  reviewTotalPages: number;
  reviewsLoaded: boolean;
  reviewsLoading: boolean;
  setTab: (tab: BusinessDetailTab) => void;
  load: (slug: string, isAuthenticated: boolean) => Promise<void>;
  loadProducts: () => Promise<void>;
  loadReviews: () => Promise<void>;
  loadMoreReviews: () => Promise<void>;
  toggleFavourite: (isAuthenticated: boolean) => Promise<string | null>;
  refreshAfterReview: (isAuthenticated: boolean) => Promise<void>;
  reset: () => void;
};

const initialState = {
  slug: null as string | null,
  tab: "about" as BusinessDetailTab,
  vendor: null as Vendor | null,
  loading: true,
  error: null as string | null,
  isSaved: false,
  favBusy: false,
  myReview: null as CustomerReview | null,
  products: [] as Product[],
  productsLoaded: false,
  productsLoading: false,
  reviews: [] as PublicReview[],
  reviewPage: 1,
  reviewTotalPages: 1,
  reviewsLoaded: false,
  reviewsLoading: false,
};

export const useBusinessDetailStore = create<BusinessDetailState>((set, get) => ({
  ...initialState,

  setTab: (tab) => {
    set({ tab });
    const { slug, productsLoaded, reviewsLoaded } = get();
    if (!slug) return;
    if (tab === "products" && !productsLoaded) void get().loadProducts();
    if (tab === "reviews" && !reviewsLoaded) void get().loadReviews();
  },

  load: async (slug, isAuthenticated) => {
    set({
      slug,
      loading: true,
      error: null,
      tab: "about",
      products: [],
      productsLoaded: false,
      reviews: [],
      reviewPage: 1,
      reviewTotalPages: 1,
      reviewsLoaded: false,
    });
    try {
      const biz = await directoryApi.business(slug);
      set({ vendor: biz });

      if (isAuthenticated) {
        try {
          const [favs, mine] = await Promise.all([
            customerApi.favourites(1, 100),
            customerApi.listReviews(1, 100),
          ]);
          set({
            isSaved: favs.items.some((row) => row.vendor.id === biz.id),
            myReview: mine.items.find((row) => row.vendorId === biz.id) ?? null,
          });
        } catch {
          set({ isSaved: false, myReview: null });
        }
      } else {
        set({ isSaved: false, myReview: null });
      }
    } catch (err) {
      set({ error: err instanceof ApiError ? err.message : "Business not found", vendor: null });
    } finally {
      set({ loading: false });
    }
  },

  loadProducts: async () => {
    const { slug, productsLoaded, productsLoading } = get();
    if (!slug || productsLoaded || productsLoading) return;
    set({ productsLoading: true });
    try {
      const prod = await directoryApi.products(slug, { page: 1, pageSize: 50 });
      set({ products: prod.items, productsLoaded: true });
    } catch {
      set({ products: [], productsLoaded: true });
    } finally {
      set({ productsLoading: false });
    }
  },

  loadReviews: async () => {
    const { slug, reviewsLoaded, reviewsLoading } = get();
    if (!slug || reviewsLoaded || reviewsLoading) return;
    set({ reviewsLoading: true });
    try {
      const rev = await directoryApi.reviews(slug, 1, 10);
      set({
        reviews: rev.items,
        reviewPage: 1,
        reviewTotalPages: rev.totalPages,
        reviewsLoaded: true,
      });
    } catch {
      set({ reviews: [], reviewsLoaded: true });
    } finally {
      set({ reviewsLoading: false });
    }
  },

  loadMoreReviews: async () => {
    const { slug, reviewPage, reviewTotalPages, reviewsLoading } = get();
    if (!slug || reviewPage >= reviewTotalPages || reviewsLoading) return;
    set({ reviewsLoading: true });
    try {
      const nextPage = reviewPage + 1;
      const rev = await directoryApi.reviews(slug, nextPage, 10);
      set((state) => ({
        reviews: [...state.reviews, ...rev.items],
        reviewPage: nextPage,
        reviewTotalPages: rev.totalPages,
      }));
    } catch {
      // ponytail: keep existing reviews on pagination failure
    } finally {
      set({ reviewsLoading: false });
    }
  },

  toggleFavourite: async (isAuthenticated) => {
    const { vendor, isSaved } = get();
    if (!vendor) return "missing";
    if (!isAuthenticated) return "auth";
    set({ favBusy: true, error: null });
    try {
      if (isSaved) {
        await customerApi.removeFavourite(vendor.id);
        set({ isSaved: false });
      } else {
        await customerApi.addFavourite(vendor.id);
        set({ isSaved: true });
      }
      return null;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Favourite failed";
      set({ error: message });
      return message;
    } finally {
      set({ favBusy: false });
    }
  },

  refreshAfterReview: async (isAuthenticated) => {
    const { slug, vendor } = get();
    if (!slug || !vendor) return;
    try {
      const [biz, rev] = await Promise.all([
        directoryApi.business(slug),
        directoryApi.reviews(slug, 1, 10),
      ]);
      set({
        vendor: biz,
        reviews: rev.items,
        reviewPage: 1,
        reviewTotalPages: rev.totalPages,
        reviewsLoaded: true,
      });
      if (isAuthenticated) {
        const mine = await customerApi.listReviews(1, 100);
        set({ myReview: mine.items.find((row) => row.vendorId === vendor.id) ?? null });
      }
    } catch {
      // optional refresh
    }
  },

  reset: () => set(initialState),
}));
