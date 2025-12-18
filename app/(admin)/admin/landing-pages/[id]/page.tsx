"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Key, Copy, Trash2, PlusCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import {
  updateLandingPageSchema,
  apiKeyBaseSchema,
  type UpdateLandingPageInput,
} from "@/lib/server/landing-pages/schema";
import { z } from "zod";
import type { LandingPage, ApiKey } from "@/types";

export default function LandingPageDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const id = params.id as string;

  const [landingPage, setLandingPage] = React.useState<LandingPage | null>(
    null
  );
  const [apiKeys, setApiKeys] = React.useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [createKeyDialogOpen, setCreateKeyDialogOpen] = React.useState(false);
  const [newApiKey, setNewApiKey] = React.useState<string | null>(null);
  const [isCreatingKey, setIsCreatingKey] = React.useState(false);

  const form = useForm<UpdateLandingPageInput>({
    resolver: zodResolver(updateLandingPageSchema),
  });

  React.useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pageResponse, keysResponse] = await Promise.all([
        fetch(`/api/organization/landing-pages/${id}`),
        fetch(`/api/organization/landing-pages/${id}/api-keys`),
      ]);

      if (!pageResponse.ok) throw new Error("Failed to load landing page");
      if (!keysResponse.ok) throw new Error("Failed to load API keys");

      const pageData = await pageResponse.json();
      const keysData = await keysResponse.json();

      setLandingPage(pageData);
      setApiKeys(keysData.apiKeys || []);
      form.reset({
        id: pageData.id,
        name: pageData.name,
        slug: pageData.slug,
        domain: pageData.domain || "",
        isActive: pageData.is_active,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load landing page",
        variant: "destructive",
      });
      router.push("/organization/landing-pages");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (values: UpdateLandingPageInput) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/organization/landing-pages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update landing page");
      }

      const updated = await response.json();
      setLandingPage(updated);
      toast({
        title: "Success",
        description: "Landing page updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update landing page",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateApiKey = async (values: CreateApiKeyInput) => {
    setIsCreatingKey(true);
    try {
      const response = await fetch(
        `/api/organization/landing-pages/${id}/api-keys`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create API key");
      }

      const data = await response.json();
      setNewApiKey(data.apiKey);
      loadData(); // Reload API keys list
      toast({
        title: "Success",
        description:
          "API key created successfully. Copy it now - you won't be able to see it again!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create API key",
        variant: "destructive",
      });
    } finally {
      setIsCreatingKey(false);
    }
  };

  const handleDeleteApiKey = async (keyId: string) => {
    try {
      const response = await fetch(
        `/api/organization/landing-pages/${id}/api-keys/${keyId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete API key");
      }

      toast({
        title: "Success",
        description: "API key deleted successfully",
      });
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete API key",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    });
  };

  if (isLoading) {
    return <div className="space-y-6">Loading...</div>;
  }

  if (!landingPage) {
    return <div className="space-y-6">Landing page not found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{landingPage.name}</h1>
        <p className="text-muted-foreground">
          Manage your landing page settings and API keys
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Landing Page Details</h2>
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
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domain (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Enable this landing page
                      </div>
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
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">API Keys</h2>
            <Button onClick={() => setCreateKeyDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New API Key
            </Button>
          </div>

          <div className="space-y-2">
            {apiKeys.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No API keys created yet. Create one to start using the API.
              </p>
            ) : (
              apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      <span className="font-medium">{key.name}</span>
                      <Badge variant={key.is_active ? "default" : "secondary"}>
                        {key.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Last used:{" "}
                      {key.last_used_at
                        ? new Date(key.last_used_at).toLocaleString()
                        : "Never"}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteApiKey(key.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <CreateApiKeyDialog
        open={createKeyDialogOpen}
        onOpenChange={setCreateKeyDialogOpen}
        onSubmit={handleCreateApiKey}
        isCreating={isCreatingKey}
        newApiKey={newApiKey}
        onClose={() => setNewApiKey(null)}
        onCopy={copyToClipboard}
      />
    </div>
  );
}

function CreateApiKeyDialog({
  open,
  onOpenChange,
  onSubmit,
  isCreating,
  newApiKey,
  onClose,
  onCopy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: z.infer<typeof apiKeyBaseSchema>) => void;
  isCreating: boolean;
  newApiKey: string | null;
  onClose: () => void;
  onCopy: (text: string) => void;
}) {
  const form = useForm<z.infer<typeof apiKeyBaseSchema>>({
    resolver: zodResolver(apiKeyBaseSchema),
    defaultValues: {
      name: "",
      expiresAt: null,
    },
  });

  React.useEffect(() => {
    if (!open) {
      form.reset();
      onClose();
    }
  }, [open, form, onClose]);

  const handleSubmit = (values: z.infer<typeof apiKeyBaseSchema>) => {
    onSubmit(values);
  };

  if (newApiKey) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>
              Copy your API key now. You won't be able to see it again!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input value={newApiKey} readOnly className="font-mono" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCopy(newApiKey)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Use this key in the Authorization header: Bearer {newApiKey}
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create API Key</DialogTitle>
          <DialogDescription>
            Create a new API key for this landing page.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Production Key" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expiresAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expires At (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      value={
                        field.value
                          ? new Date(field.value).toISOString().slice(0, 16)
                          : ""
                      }
                      onChange={(e) => {
                        field.onChange(
                          e.target.value
                            ? new Date(e.target.value).toISOString()
                            : null
                        );
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
