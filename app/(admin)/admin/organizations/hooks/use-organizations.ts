import { useQuery } from "@tanstack/react-query";

export type Organization = {
  id: string;
  name: string;
  subdomain: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  is_active: boolean;
};

type OrganizationsResponse = {
  organizations: Organization[];
  total: number;
  page: number;
  pageSize: number;
};

async function fetchOrganizations(): Promise<Organization[]> {
  const response = await fetch("/api/v1/admin/organizations", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch organizations");
  }

  const data: OrganizationsResponse = await response.json();
  return data.organizations || [];
}

export function useOrganizations() {
  return useQuery({
    queryKey: ["organizations"],
    queryFn: fetchOrganizations,
  });
}
