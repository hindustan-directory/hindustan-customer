import { apiRequest, apiUpload, imageFormFile } from "./client";
import type {
  AuthResult,
  AuthSession,
  AvailabilitySlot,
  Booking,
  BusinessCategory,
  Enquiry,
  FavouriteRow,
  Paginated,
  Product,
  PublicReview,
  CustomerReview,
  PublicUser,
  ReportReason,
  Vendor,
  VendorSearchResult,
} from "./types";

const CUSTOMER_PANEL_ROLE = "customer" as const;

export const authApi = {
  login(email: string, password: string) {
    return apiRequest<AuthResult>("/auth/login", {
      method: "POST",
      body: { email, password, role: CUSTOMER_PANEL_ROLE },
    });
  },
  registerCustomer(body: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    agreeToTerms: true;
    address?: string;
    city?: string;
  }) {
    return apiRequest<AuthResult>("/auth/register/customer", {
      method: "POST",
      body,
    });
  },
  logout(refreshToken?: string) {
    return apiRequest<{ loggedOut: true }>("/auth/logout", {
      method: "POST",
      auth: true,
      body: refreshToken ? { refreshToken } : {},
    });
  },
  forgotPassword(email: string) {
    return apiRequest<{ message: string; devResetToken?: string }>(
      "/auth/forgot-password",
      { method: "POST", body: { email } },
    );
  },
  resetPassword(token: string, newPassword: string) {
    return apiRequest<{ reset: true }>("/auth/reset-password", {
      method: "POST",
      body: { token, newPassword },
    });
  },
  changePassword(currentPassword: string, newPassword: string) {
    return apiRequest<{ changed: true }>("/auth/change-password", {
      method: "POST",
      auth: true,
      body: { currentPassword, newPassword },
    });
  },
  listSessions() {
    return apiRequest<AuthSession[]>("/auth/sessions", { auth: true });
  },
  revokeSession(sessionId: string) {
    return apiRequest<{ revoked: true }>(
      `/auth/sessions/${encodeURIComponent(sessionId)}`,
      { method: "DELETE", auth: true },
    );
  },
  revokeAllSessions() {
    return apiRequest<{ revoked: number }>("/auth/sessions", {
      method: "DELETE",
      auth: true,
    });
  },
};

export const usersApi = {
  me() {
    return apiRequest<PublicUser>("/users/me", { auth: true });
  },
  updateMe(body: { fullName?: string; phone?: string }) {
    return apiRequest<PublicUser>("/users/me", {
      method: "PATCH",
      auth: true,
      body,
    });
  },
  uploadAvatar(uri: string) {
    const form = new FormData();
    form.append("avatar", imageFormFile(uri, "avatar.jpg") as unknown as Blob);
    return apiUpload<PublicUser>("/users/me/avatar", form, { auth: true });
  },
};

export const directoryApi = {
  search(params: {
    q?: string;
    category?: string;
    city?: string;
    rating?: number;
    page?: number;
    pageSize?: number;
  }) {
    return apiRequest<Paginated<VendorSearchResult>>("/directory/search", {
      query: params,
    });
  },
  business(slug: string) {
    return apiRequest<Vendor>(`/directory/business/${encodeURIComponent(slug)}`);
  },
  reviews(slug: string, page = 1, pageSize = 20) {
    return apiRequest<Paginated<PublicReview>>(
      `/directory/business/${encodeURIComponent(slug)}/reviews`,
      { query: { page, pageSize } },
    );
  },
  products(
    slug: string,
    params?: { categoryId?: string; availability?: string; page?: number; pageSize?: number },
  ) {
    return apiRequest<Paginated<Product>>(
      `/directory/business/${encodeURIComponent(slug)}/products`,
      { query: params },
    );
  },
};

/** Referenced by API guide for taxonomy; response assumed as BusinessCategory list or paginated. */
export async function fetchCategories(): Promise<BusinessCategory[]> {
  const data = await apiRequest<BusinessCategory[] | Paginated<BusinessCategory>>(
    "/categories",
  );
  if (Array.isArray(data)) return data;
  return data.items ?? [];
}

export const customerApi = {
  favourites(page = 1, pageSize = 20) {
    return apiRequest<Paginated<FavouriteRow>>("/customer/favourites", {
      auth: true,
      query: { page, pageSize },
    });
  },
  addFavourite(vendorId: string) {
    return apiRequest<unknown>(`/customer/favourites/${vendorId}`, {
      method: "POST",
      auth: true,
    });
  },
  removeFavourite(vendorId: string) {
    return apiRequest<{ removed: boolean }>(`/customer/favourites/${vendorId}`, {
      method: "DELETE",
      auth: true,
    });
  },
  createEnquiryAuthed(body: { vendorId: string; message?: string }) {
    return apiRequest<Enquiry>("/customer/enquiries", {
      method: "POST",
      auth: true,
      body,
    });
  },
  createEnquiryGuest(body: {
    vendorId: string;
    name: string;
    phone: string;
    message?: string;
  }) {
    return apiRequest<Enquiry>("/customer/enquiries", {
      method: "POST",
      auth: false,
      body,
    });
  },
  listEnquiries(page = 1, pageSize = 20) {
    return apiRequest<Paginated<Enquiry>>("/customer/enquiries", {
      auth: true,
      query: { page, pageSize },
    });
  },
  upsertReview(body: { vendorId: string; rating: number; comment?: string }) {
    return apiRequest<unknown>("/customer/reviews", {
      method: "POST",
      auth: true,
      body,
    });
  },
  listReviews(page = 1, pageSize = 20) {
    return apiRequest<Paginated<CustomerReview>>("/customer/reviews", {
      auth: true,
      query: { page, pageSize },
    });
  },
  report(body: { vendorId: string; reason: ReportReason; details?: string }) {
    return apiRequest<unknown>("/customer/reports", {
      method: "POST",
      auth: true,
      body,
    });
  },
};

export const bookingsApi = {
  availability(vendorId: string, date: string) {
    return apiRequest<AvailabilitySlot[]>("/bookings/availability", {
      auth: true,
      query: { vendorId, date },
    });
  },
  create(body: {
    vendorId: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    notes?: string;
  }) {
    return apiRequest<Booking>("/bookings", {
      method: "POST",
      auth: true,
      body,
    });
  },
  list(page = 1, pageSize = 20) {
    return apiRequest<Paginated<Booking>>("/bookings", {
      auth: true,
      query: { page, pageSize },
    });
  },
  cancel(id: string) {
    return apiRequest<Booking>(`/bookings/${id}/cancel`, {
      method: "PATCH",
      auth: true,
    });
  },
};
