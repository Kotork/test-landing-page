"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
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
import { useOrganization, useUpdateOrganization } from "../hooks/use-organization";

export default function OrganizationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const id = params.id as string;

  const { data: organization, isLoading, error } = useOrganization(id);
  const { mutateAsync: updateOrg, isPending: isSaving } = useUpdateOrganization();

  const form = useForm<UpdateOrganizationInput>({
    resolver: zodResolver(updateOrganizationSchema),
    defaultValues: {
      id: id,
      name: "",
      subdomain: "",
      logo_url: "",
      is_active: true,
    },
  });

  React.useEffect(() => {
    if (organization) {
      form.reset({
        id: organization.id,
        name: organization.name,
        subdomain: organization.subdomain,
        logo_url: organization.logo_url || "",
        is_active: organization.is_active,
      });
    }
  }, [organization, form]);

  const onSubmit = async (values: UpdateOrganizationInput) => {
    try {
      await updateOrg({ id, data: values });
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
    }
  };

  if (isLoading) {
    return <div className="space-y-6">Loading...</div>;
  }

  if (error || !organization) {
    return (
      <div className="space-y-6">
        <div className="text-destructive">
          {error instanceof Error ? error.message : "Organization not found"}
        </div>
        <Button variant="outline" onClick={() => router.push("/admin/organizations")}>
          Back to Organizations
        </Button>
      </div>
    );
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
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <FormDescription>
                        Disable this organization to prevent access.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
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
