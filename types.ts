export type Role = "user" | "admin";
export type VerificationStatus = "none" | "pending" | "approved" | "rejected";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
  joinDate: string;
  suspended: boolean;
}

export type DocType = "national_id" | "passport";

export interface Verification {
  id: string;
  userId: string;
  docType: DocType;
  docNo: string;
  docImage?: string | undefined;
  submitDate: string;
  status: Exclude<VerificationStatus, "none">;
  note?: string | undefined;
}

export type PropertyType = "apartment" | "villa" | "house" | "building" | "land" | "shop" | "office";
export type Purpose = "sale" | "rent";
export type PropertyStatus = "available" | "unavailable" | "sold" | "rented";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface Property {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  price: number;
  area: number;
  rooms: number;
  type: PropertyType;
  purpose: Purpose;
  city: string;
  district: string;
  lat: number;
  lng: number;
  status: PropertyStatus;
  approval: ApprovalStatus;
  rejectReason?: string | undefined;
  images: string[];
  postDate: string;
  views: number;
}

export interface Review {
  id: string;
  userId: string;
  propertyId: string;
  rating: number;
  comment: string;
  date: string;
}

export type ReportTarget = "property" | "review";
export type ReportStatus = "open" | "resolved" | "dismissed";

export interface Report {
  id: string;
  userId: string;
  targetType: ReportTarget;
  targetId: string;
  /** Property the reported content belongs to (for navigation). */
  propertyId: string;
  reason: string;
  details: string;
  status: ReportStatus;
  date: string;
  snapshot?: string | undefined;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  sentAt: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  propertyId: string;
  seekerId: string;
  ownerId: string;
  messages: Message[];
}

export interface AppData {
  users: User[];
  verifications: Verification[];
  properties: Property[];
  reviews: Review[];
  reports: Report[];
  conversations: Conversation[];
  favorites: Record<string, string[]>;
}
