"use client";

import * as React from "react";
import {
  type Column,
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Archive,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  MoreHorizontal,
  Pencil,
  PlusCircle,
  Search,
  Undo,
  Eye,
} from "lucide-react";
import { useForm, useWatch, type Resolver } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  contactStatusEnum,
  createContactSchema,
  createNewsletterSchema,
  newsletterStatusEnum,
  updateContactSchema,
  updateNewsletterSchema,
  type CreateContactInput,
  type CreateNewsletterInput,
  type UpdateContactInput,
  type UpdateNewsletterInput,
} from "@/lib/server/contacts/schema";
import type { ContactSubmission, NewsletterSubmission } from "@/types";

type NewsletterRow = NewsletterSubmission;
type ContactRow = ContactSubmission;

type NewsletterFilters = {
  status: NewsletterRow["subscription_status"] | "all";
  marketing: "all" | "opted_in" | "opted_out";
  includeArchived: boolean;
  startDate?: string;
  endDate?: string;
};

type ContactFilters = {
  status: ContactRow["status"] | "all";
  marketing: "all" | "opted_in" | "opted_out";
  includeArchived: boolean;
  startDate?: string;
  endDate?: string;
};

const newsletterStatusOptions: Array<{
  label: string;
  value: NewsletterFilters["status"];
}> = [
  { label: "All statuses", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Subscribed", value: "subscribed" },
  { label: "Unsubscribed", value: "unsubscribed" },
  { label: "Bounced", value: "bounced" },
];

const contactStatusOptions: Array<{
  label: string;
  value: ContactFilters["status"];
}> = [
  { label: "All statuses", value: "all" },
  { label: "New", value: "new" },
  { label: "Open", value: "open" },
  { label: "In progress", value: "in_progress" },
  { label: "Resolved", value: "resolved" },
  { label: "Archived", value: "archived" },
];

const marketingOptions = [
  { label: "All marketing preferences", value: "all" },
  { label: "Accepted marketing", value: "opted_in" },
  { label: "Declined marketing", value: "opted_out" },
] as const;

const newsletterStatusVariant: Record<
  NewsletterRow["subscription_status"],
  "default" | "muted" | "destructive"
> = {
  subscribed: "default",
  pending: "muted",
  unsubscribed: "muted",
  bounced: "destructive",
};

const contactStatusVariant: Record<
  ContactRow["status"],
  "default" | "muted" | "destructive"
> = {
  new: "default",
  open: "default",
  in_progress: "muted",
  resolved: "muted",
  archived: "destructive",
};

const skeletonRows = Array.from({ length: 5 }).map((_, index) => index);

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function SortableHeader<TData>({
  label,
  column,
}: {
  label: string;
  column: Column<TData, unknown>;
}) {
  const sorted = column.getIsSorted();
  const Icon =
    sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ArrowUpDown;

  return (
    <button
      type="button"
      className="flex items-center gap-2 text-left font-medium"
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      <span>{label}</span>
      <Icon className="h-4 w-4" />
    </button>
  );
}

function useNewsletterColumns(
  onAction: (row: NewsletterRow, action: string) => void
) {
  return React.useMemo<ColumnDef<NewsletterRow>[]>(() => {
    return [
      {
        accessorKey: "name",
        header: ({ column }) => <SortableHeader label="Name" column={column} />,
        cell: ({ row }) => {
          const submission = row.original;
          return (
            <div className="flex flex-col">
              <span className="font-medium">
                {submission.name?.trim() || "Unnamed"}
              </span>
              <span className="text-xs text-muted-foreground">
                {submission.email}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "marketing_opt_in",
        header: ({ column }) => (
          <SortableHeader label="Marketing" column={column} />
        ),
        cell: ({ row }) => (
          <Badge variant={row.original.marketing_opt_in ? "default" : "muted"}>
            {row.original.marketing_opt_in ? "Accepted" : "Declined"}
          </Badge>
        ),
      },
      {
        accessorKey: "subscription_status",
        header: ({ column }) => (
          <SortableHeader label="Status" column={column} />
        ),
        cell: ({ row }) => (
          <Badge
            variant={newsletterStatusVariant[row.original.subscription_status]}
          >
            {row.original.subscription_status.replace("_", " ")}
          </Badge>
        ),
      },
      {
        accessorKey: "submitted_at",
        header: ({ column }) => (
          <SortableHeader label="Submitted" column={column} />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span>{formatDate(row.original.submitted_at)}</span>
            {row.original.is_archived ? (
              <span className="mt-0.5 text-xs text-destructive">Archived</span>
            ) : null}
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const submission = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onSelect={() => onAction(submission, "edit")}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() =>
                    onAction(
                      submission,
                      submission.is_archived ? "unarchive" : "archive"
                    )
                  }
                >
                  {submission.is_archived ? (
                    <Undo className="mr-2 h-4 w-4" />
                  ) : (
                    <Archive className="mr-2 h-4 w-4 text-destructive" />
                  )}
                  {submission.is_archived ? "Restore" : "Archive"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ];
  }, [onAction]);
}

function useContactColumns(
  onAction: (row: ContactRow, action: string) => void
) {
  return React.useMemo<ColumnDef<ContactRow>[]>(() => {
    return [
      {
        accessorKey: "name",
        header: ({ column }) => <SortableHeader label="Name" column={column} />,
        cell: ({ row }) => {
          const submission = row.original;
          return (
            <div className="flex flex-col">
              <span className="font-medium">
                {submission.name?.trim() || "Anonymous"}
              </span>
              <span className="text-xs text-muted-foreground">
                {submission.email}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "subject",
        header: "Subject",
        cell: ({ row }) => (
          <span className="line-clamp-2">{row.original.subject || "—"}</span>
        ),
      },
      {
        accessorKey: "message",
        header: "Message",
        cell: ({ row }) => (
          <span className="line-clamp-2 text-sm text-muted-foreground">
            {row.original.message}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <SortableHeader label="Status" column={column} />
        ),
        cell: ({ row }) => (
          <Badge variant={contactStatusVariant[row.original.status]}>
            {row.original.status.replace("_", " ")}
          </Badge>
        ),
      },
      {
        accessorKey: "submitted_at",
        header: ({ column }) => (
          <SortableHeader label="Submitted" column={column} />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span>{formatDate(row.original.submitted_at)}</span>
            {row.original.is_archived ? (
              <span className="mt-0.5 text-xs text-destructive">Archived</span>
            ) : null}
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const submission = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onSelect={() => onAction(submission, "view")}>
                  <Eye className="mr-2 h-4 w-4" />
                  View message
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onAction(submission, "edit")}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() =>
                    onAction(
                      submission,
                      submission.is_archived ? "unarchive" : "archive"
                    )
                  }
                >
                  {submission.is_archived ? (
                    <Undo className="mr-2 h-4 w-4" />
                  ) : (
                    <Archive className="mr-2 h-4 w-4 text-destructive" />
                  )}
                  {submission.is_archived ? "Restore" : "Archive"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ];
  }, [onAction]);
}

export default function ContactsPage() {
  const [activeTab, setActiveTab] = React.useState<"newsletter" | "contacts">(
    "newsletter"
  );

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Contacts &amp; Leads</h1>
        <p className="text-muted-foreground">
          Review newsletter subscribers and inbound messages. Track engagement
          and manage follow-ups in one place.
        </p>
      </header>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as typeof activeTab)}
      >
        <TabsList>
          <TabsTrigger value="newsletter">Newsletter</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
        </TabsList>

        <TabsContent value="newsletter">
          <NewsletterTab />
        </TabsContent>

        <TabsContent value="contacts">
          <ContactTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type FetchResult<T> = {
  submissions: T[];
  total: number;
  page: number;
  pageSize: number;
};

function buildQuery(params: Record<string, unknown>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.append(key, String(value));
  });
  return searchParams.toString();
}

function NewsletterTab() {
  const { toast } = useToast();

  const [searchInput, setSearchInput] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [filters, setFilters] = React.useState<NewsletterFilters>({
    status: "all",
    marketing: "all",
    includeArchived: false,
  });
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "submitted_at", desc: true },
  ]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 20,
  });

  const [data, setData] = React.useState<NewsletterRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = React.useState(0);

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<NewsletterRow | null>(null);
  const [archiving, setArchiving] = React.useState<{
    submission: NewsletterRow;
    archive: boolean;
  } | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const params = buildQuery({
          page: pagination.pageIndex + 1,
          pageSize: pagination.pageSize,
          sortBy: sorting[0]?.id ?? "submitted_at",
          sortDir: sorting[0]?.desc ? "desc" : "asc",
          search: debouncedSearch.trim() || undefined,
          status: filters.status !== "all" ? filters.status : undefined,
          marketingOptIn:
            filters.marketing === "all"
              ? undefined
              : filters.marketing === "opted_in",
          includeArchived: filters.includeArchived || undefined,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
        });

        const response = await fetch(
          `/api/admin/newsletter-submissions?${params}`,
          { cache: "no-store" }
        );
        const json = (await response.json()) as FetchResult<NewsletterRow> & {
          error?: string;
        };
        if (!response.ok) {
          throw new Error(
            json.error ?? "Failed to load newsletter submissions."
          );
        }
        setData(json.submissions ?? []);
        setTotal(json.total ?? 0);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to load newsletter submissions."
        );
        setData([]);
        setTotal(0);
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, [pagination, sorting, debouncedSearch, filters, refreshIndex]);

  const onAction = React.useCallback(
    (submission: NewsletterRow, action: string) => {
      if (action === "edit") {
        setEditing(submission);
        return;
      }
      if (action === "archive") {
        setArchiving({ submission, archive: true });
        return;
      }
      if (action === "unarchive") {
        setArchiving({ submission, archive: false });
      }
    },
    []
  );

  const columns = useNewsletterColumns(onAction);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination },
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.max(1, Math.ceil(total / pagination.pageSize)),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
  });

  const totalPages = Math.max(1, Math.ceil(total / pagination.pageSize));
  const currentPage = pagination.pageIndex + 1;
  const from = total === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const to = Math.min(
    total,
    pagination.pageIndex * pagination.pageSize + data.length
  );

  async function archiveSubmission({
    submission,
    archive,
    reason,
  }: {
    submission: NewsletterRow;
    archive: boolean;
    reason?: string;
  }) {
    try {
      const response = await fetch(
        `/api/admin/newsletter-submissions/${submission.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscriptionStatus: submission.subscription_status,
            organizationId: submission.organization_id,
            email: submission.email,
            name: submission.name,
            marketingOptIn: submission.marketing_opt_in,
            confirmedAt: submission.confirmed_at,
            unsubscribedAt: submission.unsubscribed_at,
            bounceReason: submission.bounce_reason,
            archive,
            archiveReason: reason,
          }),
        }
      );
      const json = await response.json();
      if (!response.ok) {
        throw new Error(
          json?.error ?? "Unable to update subscription archive state."
        );
      }
      toast({
        title: archive ? "Subscription archived" : "Subscription restored",
        description: archive
          ? "The subscriber will no longer appear in active lists."
          : "The subscriber is active again.",
        variant: archive ? "default" : "success",
      });
      setRefreshIndex((index) => index + 1);
    } catch (error) {
      toast({
        title: "Update failed",
        description:
          error instanceof Error ? error.message : "Unexpected archive error.",
        variant: "destructive",
      });
    } finally {
      setArchiving(null);
    }
  }

  return (
    <div className="space-y-6 rounded-lg border bg-card">
      <div className="flex flex-col gap-4 border-b px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative w-full max-w-sm">
            <Input
              placeholder="Search subscribers"
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
              className="pl-9"
            />
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={filters.status}
            onValueChange={(value) => {
              setFilters((prev) => ({
                ...prev,
                status: value as NewsletterFilters["status"],
              }));
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {newsletterStatusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.marketing}
            onValueChange={(value) => {
              setFilters((prev) => ({
                ...prev,
                marketing: value as NewsletterFilters["marketing"],
              }));
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {marketingOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={filters.startDate ?? ""}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                startDate: event.target.value || undefined,
              }))
            }
            className="w-36"
          />
          <Input
            type="date"
            value={filters.endDate ?? ""}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                endDate: event.target.value || undefined,
              }))
            }
            className="w-36"
          />
          <Button
            variant={filters.includeArchived ? "default" : "outline"}
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                includeArchived: !prev.includeArchived,
              }))
            }
          >
            {filters.includeArchived ? "Showing archived" : "Hide archived"}
          </Button>
        </div>
      </div>

      <div className="space-y-4 px-6 pb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Newsletter subscribers</h2>
          <Button onClick={() => setIsCreateOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Newsletter
          </Button>
        </div>

        <div className="overflow-x-auto">
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
                skeletonRows.map((row) => (
                  <TableRow key={`newsletter-skeleton-${row}`}>
                    <TableCell colSpan={columns.length}>
                      <div className="h-12 animate-pulse rounded bg-muted" />
                    </TableCell>
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length > 0 ? (
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
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {errorMessage ?? "No subscribers found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <span>
            Showing {from}–{to} of {total} subscribers
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={String(pagination.pageSize)}
              onValueChange={(value) =>
                setPagination({
                  pageIndex: 0,
                  pageSize: Number(value),
                })
              }
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size} rows
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    pageIndex: Math.max(0, prev.pageIndex - 1),
                  }))
                }
                disabled={currentPage <= 1 || isLoading}
              >
                Previous
              </Button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    pageIndex: Math.min(totalPages - 1, prev.pageIndex + 1),
                  }))
                }
                disabled={currentPage >= totalPages || isLoading}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>

      <NewsletterFormDialog
        mode="create"
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={() => {
          setRefreshIndex((index) => index + 1);
          toast({
            title: "Subscriber created",
            description: "The newsletter subscriber has been added.",
            variant: "success",
          });
        }}
      />

      <NewsletterFormDialog
        key={editing?.id ?? "edit-newsletter"}
        mode="edit"
        open={Boolean(editing)}
        submission={editing ?? undefined}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        onSuccess={() => {
          setRefreshIndex((index) => index + 1);
          toast({
            title: "Subscriber updated",
            description: "Changes saved successfully.",
            variant: "success",
          });
        }}
      />

      <AlertDialog
        open={Boolean(archiving)}
        onOpenChange={(open) => {
          if (!open) setArchiving(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {archiving?.archive ? "Archive subscriber" : "Restore subscriber"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {archiving?.archive
                ? "Archived subscribers are hidden from active lists but retained for historical records."
                : "Restoring will make the subscriber visible in active lists again."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {archiving?.archive ? (
            <Textarea
              placeholder="Add an optional note explaining why this subscriber is archived."
              onChange={(event) =>
                setArchiving((prev) =>
                  prev
                    ? {
                        ...prev,
                        submission: {
                          ...prev.submission,
                          archived_reason: event.target.value,
                        },
                      }
                    : prev
                )
              }
            />
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                archiving &&
                archiveSubmission({
                  submission: archiving.submission,
                  archive: archiving.archive,
                  reason: archiving.archive
                    ? archiving.submission.archived_reason ?? undefined
                    : undefined,
                })
              }
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

type NewsletterFormDialogProps =
  | {
      mode: "create";
      open: boolean;
      onOpenChange: (open: boolean) => void;
      submission?: undefined;
      onSuccess: () => void;
    }
  | {
      mode: "edit";
      open: boolean;
      onOpenChange: (open: boolean) => void;
      submission: NewsletterRow | undefined;
      onSuccess: () => void;
    };

function NewsletterFormDialog(props: NewsletterFormDialogProps) {
  const { mode, open, onOpenChange, onSuccess } = props;
  const isCreate = mode === "create";
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const resolver = React.useMemo<Resolver<any>>(
    () =>
      zodResolver(isCreate ? createNewsletterSchema : updateNewsletterSchema),
    [isCreate]
  );

  type FormValues = CreateNewsletterInput & Partial<UpdateNewsletterInput>;

  const form = useForm<FormValues>({
    resolver,
    defaultValues: isCreate
      ? ({
          email: "",
          name: "",
          marketingOptIn: true,
          subscriptionStatus: "pending",
          bounceReason: "",
        } as FormValues)
      : ({
          id: props.submission?.id ?? "",
          organizationId: props.submission?.organization_id ?? undefined,
          email: props.submission?.email ?? "",
          name: props.submission?.name ?? "",
          marketingOptIn: props.submission?.marketing_opt_in ?? false,
          subscriptionStatus:
            props.submission?.subscription_status ?? "pending",
          confirmedAt: props.submission?.confirmed_at ?? undefined,
          unsubscribedAt: props.submission?.unsubscribed_at ?? undefined,
          bounceReason: props.submission?.bounce_reason ?? "",
          archive: props.submission?.is_archived ?? false,
          archiveReason: props.submission?.archived_reason ?? "",
        } as FormValues),
  });

  React.useEffect(() => {
    if (!open) {
      setServerError(null);
      setIsSubmitting(false);
    }
  }, [open]);

  React.useEffect(() => {
    if (!isCreate && props.submission) {
      form.reset({
        id: props.submission.id,
        organizationId: props.submission.organization_id ?? undefined,
        email: props.submission.email,
        name: props.submission.name ?? "",
        marketingOptIn: props.submission.marketing_opt_in,
        subscriptionStatus: props.submission.subscription_status,
        confirmedAt: props.submission.confirmed_at ?? undefined,
        unsubscribedAt: props.submission.unsubscribed_at ?? undefined,
        bounceReason: props.submission.bounce_reason ?? "",
        archive: props.submission.is_archived,
        archiveReason: props.submission.archived_reason ?? "",
      });
    } else if (isCreate) {
      form.reset({
        email: "",
        name: "",
        marketingOptIn: true,
        subscriptionStatus: "pending",
        bounceReason: "",
      });
    }
  }, [form, props.submission, isCreate]);

  const watchedArchive = useWatch({
    control: form.control,
    name: "archive",
  });

  async function handleSubmit(values: FormValues) {
    setIsSubmitting(true);
    setServerError(null);

    const endpoint = isCreate
      ? "/api/admin/newsletter-submissions"
      : `/api/admin/newsletter-submissions/${values.id}`;

    const method = isCreate ? "POST" : "PATCH";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await response.json();
      if (!response.ok) {
        if (json?.fieldErrors) {
          Object.entries(json.fieldErrors).forEach(([key, messages]: any) => {
            form.setError(key as keyof FormValues, {
              type: "server",
              message: messages?.[0],
            });
          });
        }
        throw new Error(json?.error ?? "Unable to save subscriber.");
      }
      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Unexpected error saving subscriber."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isCreate
              ? "New newsletter subscriber"
              : "Edit newsletter subscriber"}
          </DialogTitle>
          <DialogDescription>
            {isCreate
              ? "Collect subscriber details and confirm their marketing preferences."
              : "Update subscriber preferences or archive their entry."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-5"
            onSubmit={form.handleSubmit(
              (values) => void handleSubmit(values as FormValues)
            )}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="subscriber@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Subscriber name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subscriptionStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {newsletterStatusEnum.options.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="marketingOptIn"
                render={({ field }) => (
                  <FormItem className="flex flex-col space-y-2 rounded-md border p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <FormLabel>Marketing opt-in</FormLabel>
                        <FormDescription>
                          Indicates if the subscriber agrees to receive
                          marketing emails.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="confirmedAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmed at</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        value={field.value ? field.value.slice(0, 16) : ""}
                        onChange={(event) =>
                          field.onChange(event.target.value || undefined)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Record when the subscriber confirmed their email
                      (optional).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unsubscribedAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unsubscribed at</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        value={field.value ? field.value.slice(0, 16) : ""}
                        onChange={(event) =>
                          field.onChange(event.target.value || undefined)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Track when the subscriber opted out (optional).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="bounceReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bounce reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide details if the email bounced."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isCreate ? (
              <FormField
                control={form.control}
                name="archive"
                render={({ field }) => (
                  <FormItem className="flex items-start gap-3 rounded-md border border-muted bg-muted/20 p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div>
                      <FormLabel className="font-medium">
                        Archive this subscriber
                      </FormLabel>
                      <FormDescription>
                        Archived subscribers are hidden from active lists but
                        retained for historical reporting.
                      </FormDescription>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            ) : null}

            {!isCreate && watchedArchive ? (
              <FormField
                control={form.control}
                name="archiveReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Archive reason</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add context for auditing purposes."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            {serverError ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {serverError}
              </div>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : isCreate
                  ? "Create subscriber"
                  : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ContactTab() {
  const { toast } = useToast();

  const [searchInput, setSearchInput] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [filters, setFilters] = React.useState<ContactFilters>({
    status: "all",
    marketing: "all",
    includeArchived: false,
  });
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "submitted_at", desc: true },
  ]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 20,
  });

  const [data, setData] = React.useState<ContactRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = React.useState(0);

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ContactRow | null>(null);
  const [archiving, setArchiving] = React.useState<{
    submission: ContactRow;
    archive: boolean;
  } | null>(null);
  const [viewing, setViewing] = React.useState<ContactRow | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const params = buildQuery({
          page: pagination.pageIndex + 1,
          pageSize: pagination.pageSize,
          sortBy: sorting[0]?.id ?? "submitted_at",
          sortDir: sorting[0]?.desc ? "desc" : "asc",
          search: debouncedSearch.trim() || undefined,
          status: filters.status !== "all" ? filters.status : undefined,
          marketingOptIn:
            filters.marketing === "all"
              ? undefined
              : filters.marketing === "opted_in",
          includeArchived: filters.includeArchived || undefined,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
        });

        const response = await fetch(
          `/api/admin/contact-submissions?${params}`,
          { cache: "no-store" }
        );
        const json = (await response.json()) as FetchResult<ContactRow> & {
          error?: string;
        };
        if (!response.ok) {
          throw new Error(json.error ?? "Failed to load contact submissions.");
        }
        setData(json.submissions ?? []);
        setTotal(json.total ?? 0);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to load contact submissions."
        );
        setData([]);
        setTotal(0);
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, [pagination, sorting, debouncedSearch, filters, refreshIndex]);

  const onAction = React.useCallback(
    (submission: ContactRow, action: string) => {
      if (action === "edit") {
        setEditing(submission);
        return;
      }
      if (action === "archive") {
        setArchiving({ submission, archive: true });
        return;
      }
      if (action === "unarchive") {
        setArchiving({ submission, archive: false });
        return;
      }
      if (action === "view") {
        setViewing(submission);
      }
    },
    []
  );

  const columns = useContactColumns(onAction);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination },
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.max(1, Math.ceil(total / pagination.pageSize)),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
  });

  const totalPages = Math.max(1, Math.ceil(total / pagination.pageSize));
  const currentPage = pagination.pageIndex + 1;
  const from = total === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const to = Math.min(
    total,
    pagination.pageIndex * pagination.pageSize + data.length
  );

  async function archiveSubmission({
    submission,
    archive,
    reason,
  }: {
    submission: ContactRow;
    archive: boolean;
    reason?: string;
  }) {
    try {
      const response = await fetch(
        `/api/admin/contact-submissions/${submission.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: submission.email,
            name: submission.name,
            marketingOptIn: submission.marketing_opt_in,
            subject: submission.subject,
            message: submission.message,
            metadata: submission.metadata,
            status: archive ? "archived" : submission.status,
            respondedAt: submission.responded_at,
            lastFollowUpAt: submission.last_follow_up_at,
            archive,
            archiveReason: reason,
          }),
        }
      );
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error ?? "Unable to update contact submission.");
      }
      toast({
        title: archive ? "Contact archived" : "Contact restored",
        description: archive
          ? "The message is hidden from the active queue."
          : "The message has been restored to active lists.",
        variant: archive ? "default" : "success",
      });
      setRefreshIndex((index) => index + 1);
    } catch (error) {
      toast({
        title: "Update failed",
        description:
          error instanceof Error ? error.message : "Unexpected archive error.",
        variant: "destructive",
      });
    } finally {
      setArchiving(null);
    }
  }

  return (
    <div className="space-y-6 rounded-lg border bg-card">
      <div className="flex flex-col gap-4 border-b px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative w-full max-w-sm">
            <Input
              placeholder="Search contacts"
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
              className="pl-9"
            />
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={filters.status}
            onValueChange={(value) => {
              setFilters((prev) => ({
                ...prev,
                status: value as ContactFilters["status"],
              }));
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {contactStatusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.marketing}
            onValueChange={(value) => {
              setFilters((prev) => ({
                ...prev,
                marketing: value as ContactFilters["marketing"],
              }));
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {marketingOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={filters.startDate ?? ""}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                startDate: event.target.value || undefined,
              }))
            }
            className="w-36"
          />
          <Input
            type="date"
            value={filters.endDate ?? ""}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                endDate: event.target.value || undefined,
              }))
            }
            className="w-36"
          />
          <Button
            variant={filters.includeArchived ? "default" : "outline"}
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                includeArchived: !prev.includeArchived,
              }))
            }
          >
            {filters.includeArchived ? "Showing archived" : "Hide archived"}
          </Button>
        </div>
      </div>

      <div className="space-y-4 px-6 pb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Contact form submissions</h2>
          <Button onClick={() => setIsCreateOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Contact
          </Button>
        </div>

        <div className="overflow-x-auto">
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
                skeletonRows.map((row) => (
                  <TableRow key={`contact-skeleton-${row}`}>
                    <TableCell colSpan={columns.length}>
                      <div className="h-12 animate-pulse rounded bg-muted" />
                    </TableCell>
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length > 0 ? (
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
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {errorMessage ?? "No contacts found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <span>
            Showing {from}–{to} of {total} contacts
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={String(pagination.pageSize)}
              onValueChange={(value) =>
                setPagination({
                  pageIndex: 0,
                  pageSize: Number(value),
                })
              }
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size} rows
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    pageIndex: Math.max(0, prev.pageIndex - 1),
                  }))
                }
                disabled={currentPage <= 1 || isLoading}
              >
                Previous
              </Button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    pageIndex: Math.min(totalPages - 1, prev.pageIndex + 1),
                  }))
                }
                disabled={currentPage >= totalPages || isLoading}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ContactFormDialog
        mode="create"
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={() => {
          setRefreshIndex((index) => index + 1);
          toast({
            title: "Contact created",
            description: "The message has been captured successfully.",
            variant: "success",
          });
        }}
      />

      <ContactFormDialog
        key={editing?.id ?? "edit-contact"}
        mode="edit"
        open={Boolean(editing)}
        submission={editing ?? undefined}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        onSuccess={() => {
          setRefreshIndex((index) => index + 1);
          toast({
            title: "Contact updated",
            description: "Changes saved successfully.",
            variant: "success",
          });
        }}
      />

      <AlertDialog
        open={Boolean(archiving)}
        onOpenChange={(open) => {
          if (!open) setArchiving(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {archiving?.archive ? "Archive contact" : "Restore contact"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {archiving?.archive
                ? "Archived contacts move out of active queues but remain available in reports."
                : "Restoring brings this message back into the active pipeline."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {archiving?.archive ? (
            <Textarea
              placeholder="Add an optional archive note."
              onChange={(event) =>
                setArchiving((prev) =>
                  prev
                    ? {
                        ...prev,
                        submission: {
                          ...prev.submission,
                          archived_reason: event.target.value,
                        },
                      }
                    : prev
                )
              }
            />
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                archiving &&
                archiveSubmission({
                  submission: archiving.submission,
                  archive: archiving.archive,
                  reason: archiving.archive
                    ? archiving.submission.archived_reason ?? undefined
                    : undefined,
                })
              }
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={Boolean(viewing)}
        onOpenChange={(open) => !open && setViewing(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewing?.subject ?? "Contact message"}</DialogTitle>
            <DialogDescription>
              {viewing?.email} • {formatDate(viewing?.submitted_at)}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border bg-muted/30 p-4 text-sm leading-relaxed">
            <p className="whitespace-pre-wrap">{viewing?.message}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type ContactFormDialogProps =
  | {
      mode: "create";
      open: boolean;
      onOpenChange: (open: boolean) => void;
      submission?: undefined;
      onSuccess: () => void;
    }
  | {
      mode: "edit";
      open: boolean;
      onOpenChange: (open: boolean) => void;
      submission: ContactRow | undefined;
      onSuccess: () => void;
    };

function ContactFormDialog(props: ContactFormDialogProps) {
  const { mode, open, onOpenChange, onSuccess } = props;
  const isCreate = mode === "create";
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const resolver = React.useMemo<Resolver<any>>(
    () => zodResolver(isCreate ? createContactSchema : updateContactSchema),
    [isCreate]
  );

  type FormValues = CreateContactInput & Partial<UpdateContactInput>;

  const form = useForm<FormValues>({
    resolver,
    defaultValues: isCreate
      ? ({
          name: "",
          email: "",
          subject: "",
          message: "",
          marketingOptIn: false,
          status: "new",
        } as FormValues)
      : ({
          id: props.submission?.id ?? "",
          name: props.submission?.name ?? "",
          email: props.submission?.email ?? "",
          subject: props.submission?.subject ?? "",
          message: props.submission?.message ?? "",
          marketingOptIn: props.submission?.marketing_opt_in ?? false,
          status: props.submission?.status ?? "new",
          respondedAt: props.submission?.responded_at ?? undefined,
          lastFollowUpAt: props.submission?.last_follow_up_at ?? undefined,
          archive: props.submission?.is_archived ?? false,
          archiveReason: props.submission?.archived_reason ?? "",
        } as FormValues),
  });

  React.useEffect(() => {
    if (!open) {
      setServerError(null);
      setIsSubmitting(false);
    }
  }, [open]);

  React.useEffect(() => {
    if (!isCreate && props.submission) {
      form.reset({
        id: props.submission.id,
        name: props.submission.name ?? "",
        email: props.submission.email,
        subject: props.submission.subject ?? "",
        message: props.submission.message,
        marketingOptIn: props.submission.marketing_opt_in,
        status: props.submission.status,
        respondedAt: props.submission.responded_at ?? undefined,
        lastFollowUpAt: props.submission.last_follow_up_at ?? undefined,
        archive: props.submission.is_archived,
        archiveReason: props.submission.archived_reason ?? "",
      });
    } else if (isCreate) {
      form.reset({
        name: "",
        email: "",
        subject: "",
        message: "",
        marketingOptIn: false,
        status: "new",
      });
    }
  }, [form, props.submission, isCreate]);

  const watchedArchive = useWatch({
    control: form.control,
    name: "archive",
  });

  async function handleSubmit(values: FormValues) {
    setIsSubmitting(true);
    setServerError(null);

    const endpoint = isCreate
      ? "/api/admin/contact-submissions"
      : `/api/admin/contact-submissions/${values.id}`;

    const method = isCreate ? "POST" : "PATCH";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await response.json();
      if (!response.ok) {
        if (json?.fieldErrors) {
          Object.entries(json.fieldErrors).forEach(([key, messages]: any) => {
            form.setError(key as keyof FormValues, {
              type: "server",
              message: messages?.[0],
            });
          });
        }
        throw new Error(json?.error ?? "Unable to save contact submission.");
      }
      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Unexpected error saving submission."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isCreate ? "New contact submission" : "Edit contact submission"}
          </DialogTitle>
          <DialogDescription>
            {isCreate
              ? "Log inbound messages to follow up later."
              : "Update follow-up status and notes for this contact."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-5"
            onSubmit={form.handleSubmit(
              (values) => void handleSubmit(values as FormValues)
            )}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Contact name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="contact@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="I need help with..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="marketingOptIn"
                render={({ field }) => (
                  <FormItem className="flex flex-col space-y-2 rounded-md border p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <FormLabel>Marketing opt-in</FormLabel>
                        <FormDescription>
                          Indicates whether this contact consented to marketing
                          communication.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Full contact message"
                      className="min-h-[140px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contactStatusEnum.options.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="respondedAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responded at</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        value={field.value ? field.value.slice(0, 16) : ""}
                        onChange={(event) =>
                          field.onChange(event.target.value || undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastFollowUpAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last follow-up</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        value={field.value ? field.value.slice(0, 16) : ""}
                        onChange={(event) =>
                          field.onChange(event.target.value || undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!isCreate ? (
              <FormField
                control={form.control}
                name="archive"
                render={({ field }) => (
                  <FormItem className="flex items-start gap-3 rounded-md border border-muted bg-muted/20 p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div>
                      <FormLabel className="font-medium">
                        Archive this contact
                      </FormLabel>
                      <FormDescription>
                        Archived contacts are removed from active queues and
                        marked as completed.
                      </FormDescription>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            ) : null}

            {!isCreate && watchedArchive ? (
              <FormField
                control={form.control}
                name="archiveReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Archive reason</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add a note for fellow admins."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            {serverError ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {serverError}
              </div>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : isCreate
                  ? "Create contact"
                  : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
