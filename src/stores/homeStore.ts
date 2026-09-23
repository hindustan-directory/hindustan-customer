import { create } from "zustand";
import { ApiError } from "../api/client";
import { directoryApi, fetchCategories } from "../api/endpoints";
import type { BusinessCategory, VendorSearchResult } from "../api/types";

type HomeState = {
  categories: BusinessCategory[];
  featured: VendorSearchResult[];
  loaded: boolean;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  load: () => Promise<void>;
  refresh: () => Promise<void>;
};

// Shared fetch for the two public directory calls the home screen renders.
async function fetchHome(): Promise<{
  categories: BusinessCategory[];
  featured: VendorSearchResult[];
}> {
  const [catsSettled, searchSettled] = await Promise.allSettled([
    fetchCategories(),
    directoryApi.search({ page: 1, pageSize: 10 }),
  ]);
  const categories =
    catsSettled.status === "fulfilled"
      ? catsSettled.value.filter((c) => c.isActive)
      : [];
  if (searchSettled.status === "fulfilled") {
    return { categories, featured: searchSettled.value.items };
  }
  const reason = searchSettled.reason;
  throw reason instanceof Error ? reason : new Error("Failed to load directory");
}

export const useHomeStore = create<HomeState>((set, get) => ({
  categories: [],
  featured: [],
  loaded: false,
  loading: true,
  refreshing: false,
  error: null,

  load: async () => {
    // Already have data — never block, just revalidate in the background.
    if (get().loaded) {
      void get().refresh();
      return;
    }
    set({ loading: true, error: null });
    try {
      const { categories, featured } = await fetchHome();
      set({ categories, featured, loaded: true });
    } catch (err) {
      set({ error: err instanceof ApiError ? err.message : "Could not load home" });
    } finally {
      set({ loading: false });
    }
  },

  refresh: async () => {
    // Keep the current data visible while we re-fetch behind the scenes.
    set({ refreshing: true, error: null });
    try {
      const { categories, featured } = await fetchHome();
      set({ categories, featured, loaded: true });
    } catch (err) {
      set({ error: err instanceof ApiError ? err.message : "Could not load home" });
    } finally {
      set({ refreshing: false });
    }
  },
}));
