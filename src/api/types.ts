export type Role =
  | "super_admin"
  | "admin"
  | "employee"
  | "vendor"
  | "customer"
  | "accounts"
  | "support";

export type ApiErrorBody = {
  code: string;
  message: string;
  details?: {
    formErrors?: string[];
    fieldErrors?: Record<string, string[]>;
  };
};

export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = { success: false; error: ApiErrorBody };
export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PublicUser = {
  id: string;
  role: Role;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuthResult = {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type BusinessCategory = {
  id: string;
  name: string;
  slug: string;
  iconUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type VendorSearchResult = {
  id: string;
  slug: string;
  businessName: string;
  description: string | null;
  city: string | null;
  avgRating: string;
  reviewCount: number;
  categoryName: string;
  categorySlug: string;
  photoUrl: string | null;
};

export type BusinessHour = {
  id: string;
  vendorId: string;
  dayOfWeek: number;
  opensAt: string | null;
  closesAt: string | null;
  isClosed: boolean;
};

export type VendorPhoto = {
  id: string;
  vendorId: string;
  imageUrl: string;
  caption: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type VendorCatalogue = {
  id: string;
  vendorId: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  kind?: "catalogue" | "brochure";
  createdAt: string;
  updatedAt: string;
};

export type VendorSocialLinks = {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  twitter?: string;
};

export type Vendor = {
  id: string;
  userId: string;
  businessName: string;
  slug: string;
  categoryId: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  latitude: string | null;
  longitude: string | null;
  onboardingStatus: string;
  onboardingNotes: string | null;
  approvedById: string | null;
  approvedAt: string | null;
  avgRating: string;
  reviewCount: number;
  // KYC profile v2 — present on Vendor responses as of PR #13; optional for older payloads
  businessEntityType?: string | null;
  logoUrl?: string | null;
  coverBannerUrl?: string | null;
  registrationYear?: number | null;
  employeeCount?: number | null;
  gstNumber?: string | null;
  panNumber?: string | null;
  cinLlpMsmeNumber?: string | null;
  whatsappNumber?: string | null;
  landlineNumber?: string | null;
  alternateContactNumber?: string | null;
  customerCareNumber?: string | null;
  socialLinks?: VendorSocialLinks | null;
  shopOfficeNumber?: string | null;
  buildingName?: string | null;
  street?: string | null;
  area?: string | null;
  landmark?: string | null;
  district?: string | null;
  country?: string | null;
  googleMapLink?: string | null;
  serviceRadiusKm?: number | null;
  is24x7?: boolean;
  hasEmergencyService?: boolean;
  priceRangeMin?: string | null;
  priceRangeMax?: string | null;
  minOrderValue?: string | null;
  maxOrderValue?: string | null;
  brandsAvailable?: string[];
  seoKeywords?: string[];
  gstInvoiceAvailable?: boolean;
  referralCode?: string | null;
  assignedSalesExecutiveId?: string | null;
  source?: string | null;
  kycStatus?: string;
  createdAt: string;
  updatedAt: string;
  category?: BusinessCategory;
  hours?: BusinessHour[];
  photos?: VendorPhoto[];
  catalogues?: VendorCatalogue[];
};

export type PublicReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  customerName: string;
};

/** Full review row from GET /customer/reviews (includes hidden). */
export type CustomerReview = {
  id: string;
  vendorId: string;
  customerId: string;
  rating: number;
  comment: string | null;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
  vendor?: { id: string; slug: string; businessName: string };
};

export type ProductAvailability = "in_stock" | "out_of_stock" | "discontinued";

export type ProductImage = {
  id: string;
  productId: string;
  imageUrl: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ProductCategory = {
  id: string;
  vendorId: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  vendorId: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  price: string | null;
  availability: ProductAvailability;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  images?: ProductImage[];
  category?: ProductCategory | null;
};

export type FavouriteRow = {
  favouritedAt: string;
  vendor: {
    id: string;
    slug: string;
    businessName: string;
    city: string | null;
    avgRating: string;
    categoryName: string;
  };
};

export type EnquiryStatus = "new" | "responded" | "closed";

export type Enquiry = {
  id: string;
  vendorId: string;
  customerId: string | null;
  name: string;
  phone: string;
  message: string | null;
  status: EnquiryStatus;
  createdAt: string;
  updatedAt: string;
  vendor?: { id: string; slug: string; businessName: string };
};

export type BookingStatus =
  | "requested"
  | "confirmed"
  | "rescheduled"
  | "completed"
  | "cancelled"
  | "no_show";

export type Booking = {
  id: string;
  vendorId: string;
  customerId: string;
  staffId: string | null;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  notes: string | null;
  rescheduledFromId: string | null;
  reminderSentAt: string | null;
  createdAt: string;
  updatedAt: string;
  vendor?: { id: string; slug: string; businessName: string };
};

export type AvailabilitySlot = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  capacity: number;
  booked: number;
  remaining: number;
  isAvailable: boolean;
};

export type ReportReason =
  | "fake"
  | "offensive"
  | "closed"
  | "wrong_info"
  | "other";

export type AuthSession = {
  id: string;
  deviceInfo: string | null;
  ip: string | null;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
};
