export type UserRole = "staff" | "customer";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  customer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  subdomain: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

