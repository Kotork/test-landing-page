"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  type ColumnDef,
  type Column,
  type SortingState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  MoreHorizontal,
  Pencil,
  PlusCircle,
  Search,
  Trash2,
  Key,
} from "lucide-react";
import { useForm } from "react-hook-form";

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import {
  createLandingPageSchema,
  updateLandingPageSchema,
  type CreateLandingPageInput,
  type UpdateLandingPageInput,
} from "@/lib/server/landing-pages/schema";
import type { LandingPage } from "@/types";

type LandingPageRow = LandingPage;

function SortableHeader({
  column,
  children,
}: {
  column: Column<LandingPageRow>;
  children: React.ReactNode;
}) {
  const sorted = column.getIsSorted();
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(sorted === "asc")}
      className="-ml-3 h-8 data-[state=open]:bg-accent"
    >
      {children}
      {sorted === "asc" ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : sorted === "desc" ? (
        <ArrowDown className="ml-2 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4" />
      )}
    </Button>
  );
}

const columns: ColumnDef<LandingPageRow>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <SortableHeader column={column}>Name</SortableHeader>
    ),
  },
  {
    accessorKey: "slug",
    header: ({ column }) => (
      <SortableHeader column={column}>Slug</SortableHeader>
    ),
  },
  {
    accessorKey: "domain",
    header: "Domain",
    cell: ({ row }) => {
      const domain = row.getValue("domain") as string | null;
      return domain ? (
        <span className="text-sm">{domain}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("is_active") as boolean;
      return (
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <SortableHeader column={column}>Created</SortableHeader>
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at") as string);
      return <span className="text-sm">{date.toLocaleDateString()}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <RowActions landingPage={row.original} />,
  },
];

function RowActions({ landingPage }: { landingPage: LandingPageRow }) {
  const router = useRouter();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/organization/landing-pages/${landingPage.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete landing page");
      }

      toast({
        title: "Success",
        description: "Landing page deleted successfully",
      });

      router.refresh();
      setDeleteDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete landing page",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() =>
              router.push(`/organization/landing-pages/${landingPage.id}`)
            }
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              router.push(
                `/organization/landing-pages/${landingPage.id}/api-keys`
              )
            }
          >
            <Key className="mr-2 h-4 w-4" />
            Manage API Keys
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete landing page?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{landingPage.name}" and all
              associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function LandingPagesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [landingPages, setLandingPages] = React.useState<LandingPageRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);

  const form = useForm<CreateLandingPageInput>({
    resolver: zodResolver(createLandingPageSchema),
    defaultValues: {
      name: "",
      slug: "",
      domain: "",
      isActive: true,
    },
  });

  React.useEffect(() => {
    loadLandingPages();
  }, [searchQuery, sorting]);

  const loadLandingPages = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (sorting.length > 0) {
        params.set("sortBy", sorting[0].id);
        params.set("sortDir", sorting[0].desc ? "desc" : "asc");
      }

      const response = await fetch(
        `/api/organization/landing-pages?${params.toString()}`
      );
      if (!response.ok) throw new Error("Failed to load landing pages");

      const data = await response.json();
      setLandingPages(data.landingPages || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load landing pages",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (values: CreateLandingPageInput) => {
    setIsCreating(true);
    try {
      const response = await fetch("/api/organization/landing-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create landing page");
      }

      const landingPage = await response.json();
      toast({
        title: "Success",
        description: "Landing page created successfully",
      });

      form.reset();
      setCreateDialogOpen(false);
      router.push(`/organization/landing-pages/${landingPage.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create landing page",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const table = useReactTable({
    data: landingPages,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Landing Pages</h1>
          <p className="text-muted-foreground">
            Create and manage your landing pages
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Landing Page
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search landing pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No landing pages found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Landing Page</DialogTitle>
            <DialogDescription>
              Create a new landing page for your organization.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Landing Page" {...field} />
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
                      <Input placeholder="my-landing-page" {...field} />
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
                      <Input placeholder="example.com" {...field} />
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
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
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
    </div>
  );
}
