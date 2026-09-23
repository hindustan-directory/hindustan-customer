import { create } from "zustand";
import { ApiError } from "../api/client";
import { customerApi } from "../api/endpoints";
import type { FavouriteRow } from "../api/types";

type FavouritesState = {
  items: FavouriteRow[];
  page: number;
  totalPages: number;
  total: number;
  loaded: boolean;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  removingId: string | null;
  load: (isAuthenticated: boolean) => Promise<void>;
  refresh: (isAuthenticated: boolean) => Promise<void>;
  setPage: (page: number, isAuthenticated: boolean) => Promise<void>;
  removeFavourite: (vendorId: string, isAuthenticated: boolean) => Promise<void>;
};

const initialState = {
  items: [] as FavouriteRow[],
  page: 1,
  totalPages: 1,
  total: 0,
  loaded: false,
  loading: true,
  refreshing: false,
  error: null as string | null,
  removingId: null as string | null,
};

export const useFavouritesStore = create<FavouritesState>((set, get) => ({
  ...initialState,

  load: async (isAuthenticated) => {
    if (!isAuthenticated) {
      set({ items: [], total: 0, totalPages: 1, loading: false, loaded: false });
      return;
    }
    // Blocking shimmer only on the very first load — a warm cache stays visible.
    set({ loading: !get().loaded, error: null });
    try {
      const data = await customerApi.favourites(get().page, 10);
      set({
        items: data.items,
        totalPages: data.totalPages,
        total: data.total,
        loaded: true,
      });
    } catch (err) {
      set({ error: err instanceof ApiError ? err.message : "Could not load favourites" });
    } finally {
      set({ loading: false, refreshing: false });
    }
  },

  // Background revalidate — keep cached items visible, no blocking shimmer.
  refresh: async (isAuthenticated) => {
    if (!isAuthenticated) {
      set({ items: [], total: 0, totalPages: 1, refreshing: false, loaded: false });
      return;
    }
    set({ refreshing: true, error: null });
    try {
      const data = await customerApi.favourites(get().page, 10);
      set({
        items: data.items,
        totalPages: data.totalPages,
        total: data.total,
        loaded: true,
      });
    } catch (err) {
      set({ error: err instanceof ApiError ? err.message : "Could not load favourites" });
    } finally {
      set({ refreshing: false });
    }
  },

  setPage: async (page, isAuthenticated) => {
    set({ page });
    await get().load(isAuthenticated);
  },

  removeFavourite: async (vendorId, isAuthenticated) => {
    set({ removingId: vendorId, error: null });
    try {
      await customerApi.removeFavourite(vendorId);
      await get().load(isAuthenticated);
    } catch (err) {
      set({ error: err instanceof ApiError ? err.message : "Could not remove" });
    } finally {
      set({ removingId: null });
    }
  },
}));
