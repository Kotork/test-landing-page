export type UserRole = "staff" | "user";
export type UserStatus = "pending" | "active" | "disabled";
export type NewsletterSubscriptionStatus =
  | "pending"
  | "subscribed"
  | "unsubscribed"
  | "bounced";
export type ContactStatus =
  | "new"
  | "open"
  | "in_progress"
  | "resolved"
  | "archived";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string | null;
  status: UserStatus;
  is_locked: boolean;
  locked_at?: string | null;
  last_login_at?: string | null;
  password_reset_required: boolean;
  created_by?: string | null;
  updated_by?: string | null;
  disabled_reason?: string | null;
  onboarding_note?: string | null;
  invited_at?: string | null;
  organization_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  subdomain: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  is_active: boolean;
}

export interface NewsletterSubmission {
  id: string;
  organization_id?: string | null;
  email: string;
  name?: string | null;
  marketing_opt_in: boolean;
  subscription_status: NewsletterSubscriptionStatus;
  submitted_at: string;
  confirmed_at?: string | null;
  unsubscribed_at?: string | null;
  bounce_reason?: string | null;
  is_archived: boolean;
  archived_at?: string | null;
  archived_by?: string | null;
  archived_reason?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactSubmission {
  id: string;
  organization_id?: string | null;
  name?: string | null;
  email: string;
  marketing_opt_in: boolean;
  subject?: string | null;
  message: string;
  metadata?: Record<string, unknown> | null;
  status: ContactStatus;
  submitted_at: string;
  responded_at?: string | null;
  last_follow_up_at?: string | null;
  is_archived: boolean;
  archived_at?: string | null;
  archived_by?: string | null;
  archived_reason?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminActivityLog {
  id: string;
  resource_type: string;
  resource_id: string;
  action: string;
  details?: Record<string, unknown> | null;
  acted_by?: string | null;
  created_at: string;
}

export interface LandingPage {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  domain?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

export interface ApiKey {
  id: string;
  landing_page_id: string;
  key_hash: string;
  name: string;
  last_used_at?: string | null;
  expires_at?: string | null;
  is_active: boolean;
  created_at: string;
  created_by?: string | null;
}

export interface LandingPageSubmission {
  id: string;
  landing_page_id: string;
  data: Record<string, unknown>;
  submission_type: "newsletter" | "contact" | "analytics" | "custom";
  created_at: string;
}
