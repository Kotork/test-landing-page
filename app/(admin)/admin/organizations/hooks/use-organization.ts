import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Organization } from "@/types";
import { type UpdateOrganizationInput } from "@/lib/server/organizations/schema";

async function fetchOrganization(id: string): Promise<Organization> {
    const response = await fetch(`/api/v1/admin/organizations/${id}`);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch organization");
    }
    return response.json();
}

async function updateOrganization({
    id,
    data,
}: {
    id: string;
    data: UpdateOrganizationInput;
}): Promise<Organization> {
    const response = await fetch(`/api/v1/admin/organizations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update organization");
    }

    return response.json();
}

async function deleteOrganization(id: string): Promise<void> {
    const response = await fetch(`/api/v1/admin/organizations/${id}`, {
        method: "DELETE",
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete organization");
    }
}

export function useOrganization(id: string) {
    return useQuery({
        queryKey: ["organization", id],
        queryFn: () => fetchOrganization(id),
        enabled: !!id,
    });
}

export function useUpdateOrganization() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateOrganization,
        onSuccess: (updatedOrg) => {
            queryClient.setQueryData(["organization", updatedOrg.id], updatedOrg);
            // Invalidate the list as well so the main table reflects changes (e.g. name change)
            queryClient.invalidateQueries({ queryKey: ["organizations"] });
        },
    });
}

export function useDeleteOrganization() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteOrganization,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["organizations"] });
        },
    });
}
