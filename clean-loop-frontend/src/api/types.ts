// Types mirror the FastAPI Pydantic schemas in clean-loop/app/schemas.

export type Role = "citizen" | "municipal_staff" | "admin";

export type ComplaintStatus =
  | "pending"
  | "acknowledged"
  | "in_progress"
  | "resolved"
  | "closed"
  | "rejected";

export type ComplaintPriority = "low" | "medium" | "high" | "urgent";

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  role: Role;
  is_active: boolean;
  supabase_user_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserCreate {
  email: string;
  full_name: string;
  phone?: string;
  password: string;
}

export interface WasteCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  color_code?: string | null;
  icon?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DisposalRule {
  id: string;
  category_id: string;
  title: string;
  description?: string | null;
  instructions: string;
  locality?: string | null;
  pickup_schedule?: string | null;
  pickup_time?: string | null;
  tips?: string | null;
  warnings?: string | null;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClassificationResult {
  item_name: string;
  category: WasteCategory;
  confidence: number;
  disposal_instructions: string;
  tips?: string | null;
  rules: DisposalRule[];
}

export interface Facility {
  id: string;
  name: string;
  facility_type: string;
  description?: string | null;
  address: string;
  city: string;
  state?: string | null;
  postal_code?: string | null;
  country: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  operating_hours?: string | null;
  accepted_waste_types?: string | null; // JSON array stored as text
  latitude?: number | null;
  longitude?: number | null;
  is_verified: boolean;
  verified_at?: string | null;
  verified_by?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FacilityList {
  facilities: Facility[];
  total: number;
  page: number;
  page_size: number;
}

export interface StatusHistory {
  id: string;
  complaint_id: string;
  changed_by: string;
  previous_status?: ComplaintStatus | null;
  new_status: ComplaintStatus;
  remarks?: string | null;
  created_at: string;
}

export interface Feedback {
  id: string;
  complaint_id: string;
  user_id: string;
  rating: number;
  comment?: string | null;
  created_at: string;
}

export interface Complaint {
  id: string;
  client_generated_id?: string | null;
  reporter_id: string;
  title: string;
  description: string;
  waste_category_id?: string | null;
  address?: string | null;
  city?: string | null;
  locality?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  facility_id?: string | null;
  priority: ComplaintPriority;
  photo_url?: string | null;
  status: ComplaintStatus;
  resolution_notes?: string | null;
  resolved_at?: string | null;
  resolved_by?: string | null;
  created_at: string;
  updated_at: string;
  reporter: User;
  waste_category?: WasteCategory | null;
  facility?: Facility | null;
  status_history: StatusHistory[];
  feedbacks: Feedback[];
}

export interface ComplaintList {
  complaints: Complaint[];
  total: number;
  page: number;
  page_size: number;
}

export interface ComplaintCreate {
  title: string;
  description: string;
  waste_category_id?: string | null;
  address?: string | null;
  city?: string | null;
  locality?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  facility_id?: string | null;
  priority: ComplaintPriority;
  photo_url?: string | null;
  client_generated_id?: string | null;
}

export interface SyncResult {
  synced: string[];
  duplicates: string[];
  errors: Record<string, unknown>[];
}

export interface AnalyticsOverview {
  total_complaints: number;
  status_breakdown: { status: string; count: number }[];
  category_breakdown: { category_name: string; count: number }[];
  avg_resolution_hours: number;
  complaints_this_month: number;
  complaints_last_month: number;
}

export interface Hotspot {
  latitude: number;
  longitude: number;
  complaint_count: number;
  locality: string;
  top_category: string;
}
