// ============================================================
// NEXORA — TypeScript Types
// Mirrors the Supabase schema exactly
// ============================================================

// ────────────────────────────────────────
// ENUMS
// ────────────────────────────────────────
export type UserRole = "member" | "chapter_admin" | "super_admin" | "visitor";
export type ReferralStatus = "pending" | "accepted" | "completed" | "rejected";
export type AttendanceStatus = "present" | "absent" | "visitor";
export type MeetingStatus = "scheduled" | "completed" | "cancelled";

// ────────────────────────────────────────
// TABLE ROW TYPES
// ────────────────────────────────────────

export interface Chapter {
  id: string;
  name: string;
  location: string | null;
  city: string | null;
  state: string | null;
  country: string;
  meeting_day: string | null;
  meeting_time: string | null;
  meeting_venue: string | null;
  chapter_admin_id: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  chapter_id: string | null;
  bio: string | null;
  business_name: string | null;
  business_category: string | null;
  business_tagline: string | null;
  business_website: string | null;
  avatar_url: string | null;
  logo_url: string | null;
  linkedin_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Referral {
  id: string;
  sender_id: string;
  receiver_id: string;
  referred_person_name: string;
  referred_person_contact: string | null;
  business_category: string | null;
  description: string | null;
  estimated_value: number;
  actual_value: number;
  status: ReferralStatus;
  notes: string | null;
  chapter_id: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface Meeting {
  id: string;
  chapter_id: string;
  title: string;
  meeting_date: string;
  start_time: string | null;
  end_time: string | null;
  venue: string | null;
  agenda: string | null;
  notes: string | null;
  status: MeetingStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Visitor {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  business_name: string | null;
  business_category: string | null;
  chapter_id: string;
  invited_by: string | null;
  visit_date: string | null;
  meeting_id: string | null;
  notes: string | null;
  converted_to_member: boolean;
  created_at: string;
}

export interface Attendance {
  id: string;
  meeting_id: string;
  user_id: string | null;
  visitor_id: string | null;
  status: AttendanceStatus;
  marked_by: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string | null;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

// ────────────────────────────────────────
// JOINED / ENRICHED TYPES
// ────────────────────────────────────────

export interface ProfileWithChapter extends Profile {
  chapter: Chapter | null;
}

export interface ReferralWithProfiles extends Referral {
  sender: Profile;
  receiver: Profile;
}

export interface MeetingWithChapter extends Meeting {
  chapter: Chapter;
}

export interface AttendanceWithDetails extends Attendance {
  user: Profile | null;
  visitor: Visitor | null;
  meeting: Meeting;
}

export interface VisitorWithDetails extends Visitor {
  invited_by_profile: Profile | null;
  meeting: Meeting | null;
}

// ────────────────────────────────────────
// SUPABASE DATABASE GENERIC TYPE
// ────────────────────────────────────────

export type Database = {
  public: {
    Tables: {
      chapters: {
        Row: Chapter;
        Insert: Omit<Chapter, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Chapter, "id">>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Profile, "id">>;
      };
      referrals: {
        Row: Referral;
        Insert: Omit<Referral, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Referral, "id">>;
      };
      meetings: {
        Row: Meeting;
        Insert: Omit<Meeting, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Meeting, "id">>;
      };
      visitors: {
        Row: Visitor;
        Insert: Omit<Visitor, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Visitor, "id">>;
      };
      attendance: {
        Row: Attendance;
        Insert: Omit<Attendance, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Attendance, "id">>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Notification, "id">>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_super_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      referral_status: ReferralStatus;
      attendance_status: AttendanceStatus;
      meeting_status: MeetingStatus;
    };
  };
};

// ────────────────────────────────────────
// FORM / INPUT TYPES
// ────────────────────────────────────────

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
  business_name?: string;
  business_category?: string;
  business_tagline?: string;
  chapter_id?: string;
}

export interface ReferralFormData {
  receiver_id: string;
  referred_person_name: string;
  referred_person_contact?: string;
  business_category?: string;
  description?: string;
  estimated_value?: number;
}

export interface MeetingFormData {
  title: string;
  meeting_date: string;
  start_time?: string;
  end_time?: string;
  venue?: string;
  agenda?: string;
}

export interface VisitorFormData {
  full_name: string;
  email?: string;
  phone?: string;
  business_name?: string;
  business_category?: string;
  invited_by?: string;
  meeting_id?: string;
  visit_date?: string;
  notes?: string;
}

// ────────────────────────────────────────
// API RESPONSE TYPES
// ────────────────────────────────────────

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ────────────────────────────────────────
// DASHBOARD STATS TYPE
// ────────────────────────────────────────

export interface DashboardStats {
  totalMembers: number;
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  totalReferralValue: number;
  upcomingMeetings: number;
  myReferralsSent: number;
  myReferralsReceived: number;
}
