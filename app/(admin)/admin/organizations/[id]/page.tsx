"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  updateOrganizationSchema,
  type UpdateOrganizationInput,
} from "@/lib/server/organizations/schema";
import type { Organization } from "@/types";

export default function OrganizationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const id = params.id as string;

  const [organization, setOrganization] = React.useState<Organization | null>(
    null
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  const form = useForm<UpdateOrganizationInput>({
    resolver: zodResolver(updateOrganizationSchema),
  });

  React.useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/organizations/${id}`);

      if (!response.ok) throw new Error("Failed to load organization");

      const data = await response.json();
      setOrganization(data);
      form.reset({
        id: data.id,
        name: data.name,
        subdomain: data.subdomain,
        logo_url: data.logo_url || "",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load organization",
        variant: "destructive",
      });
      router.push("/admin/organizations");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (values: UpdateOrganizationInput) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/organizations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update organization");
      }

      const updated = await response.json();
      setOrganization(updated);
      toast({
        title: "Success",
        description: "Organization updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update organization",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="space-y-6">Loading...</div>;
  }

  if (!organization) {
    return <div className="space-y-6">Organization not found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{organization.name}</h1>
        <p className="text-muted-foreground">Manage organization settings</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Organization Details</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subdomain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subdomain</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="logo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo URL (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </Form>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Organization Information</h2>
          <div className="space-y-4 rounded-lg border p-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Created
              </div>
              <div className="text-sm">
                {new Date(organization.created_at).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Last Updated
              </div>
              <div className="text-sm">
                {new Date(organization.updated_at).toLocaleString()}
              </div>
            </div>
            {organization.logo_url && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Logo Preview
                </div>
                <div className="mt-2">
                  <img
                    src={organization.logo_url}
                    alt="Logo"
                    className="h-16 w-16 rounded object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
