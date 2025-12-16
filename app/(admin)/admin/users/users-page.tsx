"use client";

import * as React from "react";
import {
  type ColumnDef,
  type Column,
  type SortingState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Lock,
  Mail,
  MoreHorizontal,
  RefreshCcw,
  Send,
  ShieldAlert,
  Unlock,
  UserCog,
  UserPlus,
  Search,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  type CreateUserInput,
  type UpdateUserInput,
  createUserSchema,
  updateUserSchema,
} from "@/lib/users/schema";
import type { User, UserStatus } from "@/types";

type AdminUser = User & {
  last_login_at?: string | null;
  disabled_reason?: string | null;
  onboarding_note?: string | null;
};

type FetchResponse = {
  users: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
};

type RowAction =
  | "edit"
  | "disable"
  | "activate"
  | "lock"
  | "unlock"
  | "resetPassword"
  | "resendInvite";

type ConfirmableAction = Extract<
  RowAction,
  "disable" | "lock" | "unlock" | "resetPassword"
>;

type PendingActionState = {
  action: ConfirmableAction;
  user: AdminUser;
  reason?: string;
};

type SubmitResult = {
  success: boolean;
  fieldErrors?: Record<string, string[]>;
  error?: string;
};

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const DEFAULT_SORTING: SortingState = [{ id: "created_at", desc: true }];

const ROLE_OPTIONS = [
  { label: "All roles", value: "all" },
  { label: "Staff", value: "staff" },
  { label: "Customer", value: "customer" },
] as const;

const STATUS_OPTIONS = [
  { label: "All statuses", value: "all" },
  { label: "Active", value: "active" },
  { label: "Pending", value: "pending" },
  { label: "Disabled", value: "disabled" },
] as const;

const LOCK_OPTIONS = [
  { label: "All accounts", value: "all" },
  { label: "Locked", value: "locked" },
  { label: "Unlocked", value: "unlocked" },
] as const;

const statusVariantMap: Record<
  UserStatus,
  "default" | "muted" | "destructive"
> = {
  active: "default",
  pending: "muted",
  disabled: "destructive",
};

function deriveFallbackName(email: string) {
  const [prefix] = email.split("@");
  return prefix ? prefix.charAt(0).toUpperCase() + prefix.slice(1) : "User";
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatRelativeTime(value: string | null | undefined) {
  if (!value) return "No sign-ins yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No sign-ins yet";
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) {
    return rtf.format(Math.round(diffMinutes), "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 30) {
    return rtf.format(diffDays, "day");
  }

  const diffMonths = Math.round(diffDays / 30);
  if (Math.abs(diffMonths) < 12) {
    return rtf.format(diffMonths, "month");
  }

  const diffYears = Math.round(diffMonths / 12);
  return rtf.format(diffYears, "year");
}

function SortableHeader({
  column,
  label,
}: {
  column: Column<AdminUser, unknown>;
  label: string;
}) {
  const sorted = column.getIsSorted();
  const Icon =
    sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ArrowUpDown;

  return (
    <button
      type="button"
      onClick={() => column.toggleSorting(sorted === "asc")}
      className="flex items-center gap-2 text-left font-medium"
    >
      <span>{label}</span>
      <Icon className="h-4 w-4" />
    </button>
  );
}

function buildColumns(
  onAction: (user: AdminUser, action: RowAction) => void
): ColumnDef<AdminUser>[] {
  return [
    {
      accessorKey: "full_name",
      header: ({ column }) => <SortableHeader column={column} label="Name" />,
      cell: ({ row }) => {
        const user = row.original;
        const name = user.full_name?.trim() || deriveFallbackName(user.email);
        return (
          <div className="flex flex-col">
            <span className="font-medium">{name}</span>
            <span className="text-xs text-muted-foreground">{user.id}</span>
          </div>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "email",
      header: ({ column }) => <SortableHeader column={column} label="Email" />,
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{user.email}</span>
          </div>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "role",
      header: ({ column }) => <SortableHeader column={column} label="Role" />,
      cell: ({ row }) => {
        const role = row.original.role;
        return (
          <Badge variant={role === "staff" ? "default" : "muted"}>
            {role === "staff" ? "Staff" : "Customer"}
          </Badge>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "status",
      header: ({ column }) => <SortableHeader column={column} label="Status" />,
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-2">
            <Badge variant={statusVariantMap[user.status]}>
              {user.status === "pending"
                ? "Pending"
                : user.status === "active"
                ? "Active"
                : "Disabled"}
            </Badge>
            {user.is_locked ? (
              <span className="flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                <Lock className="h-3 w-3" />
                Locked
              </span>
            ) : null}
          </div>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "last_login_at",
      header: ({ column }) => (
        <SortableHeader column={column} label="Last Login" />
      ),
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex flex-col">
            <span>{formatRelativeTime(user.last_login_at)}</span>
            <span className="text-xs text-muted-foreground">
              {formatDateTime(user.last_login_at)}
            </span>
          </div>
        );
      },
      enableSorting: true,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const user = row.original;
        const isDisabled = user.status === "disabled";
        const isLocked = user.is_locked;

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
              <DropdownMenuItem onSelect={() => onAction(user, "edit")}>
                <UserCog className="mr-2 h-4 w-4" />
                Edit profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() =>
                  onAction(user, isDisabled ? "activate" : "disable")
                }
              >
                <ShieldAlert className="mr-2 h-4 w-4 text-destructive" />
                {isDisabled ? "Activate account" : "Disable account"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => onAction(user, isLocked ? "unlock" : "lock")}
              >
                {isLocked ? (
                  <Unlock className="mr-2 h-4 w-4" />
                ) : (
                  <Lock className="mr-2 h-4 w-4" />
                )}
                {isLocked ? "Unlock" : "Lock"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => onAction(user, "resetPassword")}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Require password reset
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => onAction(user, "resendInvite")}
                disabled={user.status === "active"}
              >
                <Send className="mr-2 h-4 w-4" />
                Resend onboarding email
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}

function mapUserToUpdatePayload(user: AdminUser): UpdateUserInput {
  return {
    id: user.id,
    fullName:
      user.full_name && user.full_name.trim().length >= 2
        ? user.full_name
        : deriveFallbackName(user.email),
    email: user.email,
    role: user.role,
    status: user.status,
    isLocked: user.is_locked,
    passwordResetRequired: user.password_reset_required,
    password: undefined,
    onboardingNote: user.onboarding_note ?? "",
    disabledReason: user.disabled_reason ?? "",
    sendOnboardingEmail: false,
    confirmDestructive: false,
  };
}

type FiltersState = {
  role: (typeof ROLE_OPTIONS)[number]["value"];
  status: (typeof STATUS_OPTIONS)[number]["value"];
  locked: (typeof LOCK_OPTIONS)[number]["value"];
};

const initialFilters: FiltersState = {
  role: "all",
  status: "all",
  locked: "all",
};

const initialPagination = {
  pageIndex: 0,
  pageSize: 20,
};

const skeletonRows = Array.from({ length: 5 }).map((_, index) => index);

function UsersPage() {
  const { toast } = useToast();
  const [searchInput, setSearchInput] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [filters, setFilters] = React.useState<FiltersState>(initialFilters);
  const [sorting, setSorting] = React.useState<SortingState>(DEFAULT_SORTING);
  const [pagination, setPagination] = React.useState(initialPagination);
  const [data, setData] = React.useState<AdminUser[]>([]);
  const [total, setTotal] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = React.useState(0);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<AdminUser | null>(null);
  const [pendingAction, setPendingAction] =
    React.useState<PendingActionState | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadUsers = React.useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams();
      params.set("page", (pagination.pageIndex + 1).toString());
      params.set("pageSize", pagination.pageSize.toString());

      if (sorting[0]) {
        params.set("sortBy", sorting[0].id);
        params.set("sortDir", sorting[0].desc ? "desc" : "asc");
      }

      if (debouncedSearch.trim().length > 0) {
        params.set("search", debouncedSearch.trim());
      }

      if (filters.role !== "all") {
        params.set("role", filters.role);
      }
      if (filters.status !== "all") {
        params.set("status", filters.status);
      }
      if (filters.locked !== "all") {
        params.set("isLocked", filters.locked === "locked" ? "true" : "false");
      }

      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      const json = (await response.json()) as FetchResponse & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(json?.error ?? "Failed to load users.");
      }

      setData(json.users ?? []);
      setTotal(json.total ?? 0);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load users."
      );
      setData([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [pagination, sorting, debouncedSearch, filters]);

  React.useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const onAction = React.useCallback(
    (user: AdminUser, action: RowAction) => {
      if (action === "edit") {
        setEditingUser(user);
        return;
      }

      if (action === "activate") {
        void performUpdate(user, {
          status: "active",
          disabledReason: "",
          confirmDestructive: false,
        });
        return;
      }

      if (action === "resendInvite") {
        void performUpdate(user, {
          sendOnboardingEmail: true,
        });
        return;
      }

      setPendingAction({ action, user });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const columns = React.useMemo(() => buildColumns(onAction), [onAction]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination,
    },
    manualPagination: true,
    manualSorting: true,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    pageCount: Math.ceil(total / pagination.pageSize) || 1,
    getCoreRowModel: getCoreRowModel(),
  });

  async function performUpdate(
    user: AdminUser,
    overrides: Partial<UpdateUserInput>
  ) {
    const basePayload = mapUserToUpdatePayload(user);
    const payload: UpdateUserInput = {
      ...basePayload,
      ...overrides,
      // ensure booleans have defaults
      sendOnboardingEmail: overrides.sendOnboardingEmail ?? false,
      confirmDestructive: overrides.confirmDestructive ?? false,
    };

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const json = await response.json();

      if (!response.ok) {
        const message =
          json?.error ??
          "We could not update the user. Please review the request and try again.";
        toast({
          title: "Update failed",
          description: message,
          variant: "destructive",
        });
        return { success: false };
      }

      toast({
        title: "User updated",
        description: `Changes saved for ${user.email}`,
        variant: "success",
      });
      setRefreshIndex((index) => index + 1);
      return { success: true };
    } catch (error) {
      toast({
        title: "Update failed",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setPendingAction(null);
    }
  }

  async function executePendingAction() {
    if (!pendingAction) return;
    const { user, action } = pendingAction;
    const reason = pendingAction.reason ?? "";

    switch (action) {
      case "disable":
        return performUpdate(user, {
          status: "disabled",
          disabledReason: reason,
          confirmDestructive: true,
        });
      case "lock":
        return performUpdate(user, {
          isLocked: true,
          confirmDestructive: true,
        });
      case "unlock":
        return performUpdate(user, {
          isLocked: false,
        });
      case "resetPassword":
        return performUpdate(user, {
          passwordResetRequired: true,
          confirmDestructive: true,
        });
      default:
        return { success: false };
    }
  }

  async function submitCreateUser(
    values: CreateUserInput
  ): Promise<SubmitResult> {
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const json = await response.json();

      if (!response.ok) {
        return {
          success: false,
          fieldErrors: json?.fieldErrors,
          error:
            json?.error ??
            "We were unable to create the user. Please try again with different details.",
        };
      }

      toast({
        title: "New user created",
        description: `An account for ${json.email ?? values.email} is ready.`,
        variant: "success",
      });
      setRefreshIndex((index) => index + 1);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error creating the user.",
      };
    }
  }

  async function submitUpdateUser(
    values: UpdateUserInput
  ): Promise<SubmitResult> {
    try {
      const response = await fetch(`/api/admin/users/${values.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      const json = await response.json();

      if (!response.ok) {
        return {
          success: false,
          fieldErrors: json?.fieldErrors,
          error:
            json?.error ??
            "We were unable to save these changes. Review the form for details.",
        };
      }

      toast({
        title: "User updated",
        description: `Saved changes for ${json.email ?? values.email}.`,
        variant: "success",
      });
      setRefreshIndex((index) => index + 1);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error updating this user.",
      };
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pagination.pageSize));
  const currentPage = pagination.pageIndex + 1;
  const from = total === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const to = Math.min(
    total,
    pagination.pageIndex * pagination.pageSize + data.length
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">User Management</h1>
          <p className="text-muted-foreground">
            Review all customer and staff accounts. Filter, search, and update
            profiles from a single view.
          </p>
        </div>
        <Button size="lg" onClick={() => setCreateOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          New User
        </Button>
      </header>

      <section className="rounded-lg border bg-card">
        <div className="flex flex-col gap-4 border-b px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 gap-2">
            <div className="relative w-full max-w-sm">
              <Input
                placeholder="Search by name, email, or ID"
                value={searchInput}
                onChange={(event) => {
                  setSearchInput(event.target.value);
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                }}
                className="pl-9"
                aria-label="Search users"
              />
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select
              value={filters.role}
              onValueChange={(value) => {
                const nextRole = value as FiltersState["role"];
                setFilters((prev) => ({ ...prev, role: nextRole }));
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(value) => {
                const nextStatus = value as FiltersState["status"];
                setFilters((prev) => ({ ...prev, status: nextStatus }));
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.locked}
              onValueChange={(value) => {
                const nextLocked = value as FiltersState["locked"];
                setFilters((prev) => ({ ...prev, locked: nextLocked }));
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCK_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
                  <TableRow key={`skeleton-${row}`}>
                    <TableCell colSpan={6}>
                      <div className="h-12 animate-pulse rounded bg-muted" />
                    </TableCell>
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="cursor-pointer">
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
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {errorMessage ?? "No users found with this filter."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <footer className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {from}–{to} of {total} users
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Rows per page
              </span>
              <Select
                value={String(pagination.pageSize)}
                onValueChange={(value) => {
                  setPagination({
                    pageIndex: 0,
                    pageSize: Number(value),
                  });
                }}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              <span className="text-sm text-muted-foreground">
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
        </footer>
      </section>

      <UserFormDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={submitCreateUser}
      />

      <UserFormDialog
        key={editingUser?.id ?? "edit-user"}
        mode="edit"
        open={Boolean(editingUser)}
        onOpenChange={(open) => {
          if (!open) setEditingUser(null);
        }}
        user={editingUser ?? undefined}
        onSubmit={submitUpdateUser}
      />

      <AlertDialog
        open={Boolean(pendingAction)}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.action === "disable" && "Disable account"}
              {pendingAction?.action === "lock" && "Lock account"}
              {pendingAction?.action === "unlock" && "Unlock account"}
              {pendingAction?.action === "resetPassword" &&
                "Require password reset"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.action === "disable" &&
                "Disabled accounts lose access immediately. You can reactivate them later from this dashboard."}
              {pendingAction?.action === "lock" &&
                "Locked accounts cannot sign in until you unlock them. Existing sessions will be terminated where possible."}
              {pendingAction?.action === "unlock" &&
                "Unlocking restores access immediately."}
              {pendingAction?.action === "resetPassword" &&
                "We will flag this account to reset their password on the next login."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {pendingAction?.action === "disable" ? (
            <Textarea
              value={pendingAction.reason ?? ""}
              onChange={(event) =>
                setPendingAction((prev) =>
                  prev ? { ...prev, reason: event.target.value } : prev
                )
              }
              placeholder="Add a short note for auditing (optional)"
              className="min-h-[80px]"
            />
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void executePendingAction()}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

type UserFormDialogProps =
  | {
      mode: "create";
      open: boolean;
      onOpenChange: (open: boolean) => void;
      user?: undefined;
      onSubmit: (values: CreateUserInput) => Promise<SubmitResult>;
    }
  | {
      mode: "edit";
      open: boolean;
      onOpenChange: (open: boolean) => void;
      user: AdminUser | undefined;
      onSubmit: (values: UpdateUserInput) => Promise<SubmitResult>;
    };

function UserFormDialog(props: UserFormDialogProps) {
  const { mode, open, onOpenChange, onSubmit } = props;
  const isCreate = mode === "create";
  type UserFormValues = CreateUserInput & Partial<UpdateUserInput>;
  const resolver = React.useMemo<Resolver<UserFormValues>>(
    () =>
      zodResolver(
        isCreate ? createUserSchema : updateUserSchema
      ) as Resolver<UserFormValues>,
    [isCreate]
  );

  const form = useForm<UserFormValues>({
    resolver,
    defaultValues: isCreate
      ? ({
          fullName: "",
          email: "",
          role: "staff",
          status: "pending",
          isLocked: false,
          passwordResetRequired: false,
          sendOnboardingEmail: true,
          password: "",
          onboardingNote: "",
          disabledReason: "",
          confirmDestructive: false,
        } as UserFormValues)
      : ({
          id: props.user?.id ?? "",
          fullName:
            props.user?.full_name ??
            deriveFallbackName(props.user?.email ?? ""),
          email: props.user?.email ?? "",
          role: props.user?.role ?? "staff",
          status: props.user?.status ?? "pending",
          isLocked: props.user?.is_locked ?? false,
          passwordResetRequired: props.user?.password_reset_required ?? false,
          sendOnboardingEmail: false,
          password: "",
          onboardingNote: props.user?.onboarding_note ?? "",
          disabledReason: props.user?.disabled_reason ?? "",
          confirmDestructive: false,
        } as UserFormValues),
  });

  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setServerError(null);
      setIsSubmitting(false);
    }
  }, [open]);

  React.useEffect(() => {
    if (isCreate) {
      form.reset();
      return;
    }

    if (props.user) {
      form.reset({
        id: props.user.id,
        fullName: props.user.full_name ?? deriveFallbackName(props.user.email),
        email: props.user.email,
        role: props.user.role,
        status: props.user.status,
        isLocked: props.user.is_locked,
        passwordResetRequired: props.user.password_reset_required,
        sendOnboardingEmail: false,
        password: "",
        onboardingNote: props.user.onboarding_note ?? "",
        disabledReason: props.user.disabled_reason ?? "",
        confirmDestructive: false,
      });
    }
  }, [form, props.user, isCreate]);

  const watchedStatus = useWatch<UserFormValues>({
    control: form.control,
    name: "status",
  });
  const watchedIsLocked = useWatch<UserFormValues>({
    control: form.control,
    name: "isLocked",
  });
  const watchedPasswordReset = useWatch<UserFormValues>({
    control: form.control,
    name: "passwordResetRequired",
  });
  const watchedPassword = useWatch<UserFormValues>({
    control: form.control,
    name: "password",
  });
  const watchedSendOnboardingRaw = useWatch<UserFormValues>({
    control: form.control,
    name: "sendOnboardingEmail",
  });
  const watchedSendOnboarding = watchedSendOnboardingRaw === true;

  const destructiveChange =
    !isCreate &&
    ((props.user?.status !== "disabled" && watchedStatus === "disabled") ||
      (!props.user?.is_locked && watchedIsLocked) ||
      watchedPasswordReset ||
      Boolean(watchedPassword));

  React.useEffect(() => {
    if (!isCreate && !destructiveChange) {
      form.setValue("confirmDestructive", false);
    }
  }, [destructiveChange, form, isCreate]);

  async function handleSubmit(values: UserFormValues) {
    setIsSubmitting(true);
    setServerError(null);

    form.clearErrors();

    const payload = (
      isCreate
        ? ({
            fullName: values.fullName,
            email: values.email,
            role: values.role,
            status: values.status,
            isLocked: values.isLocked,
            passwordResetRequired: values.passwordResetRequired,
            onboardingNote: values.onboardingNote,
            disabledReason: values.disabledReason,
            sendOnboardingEmail: values.sendOnboardingEmail ?? false,
            password: values.password,
          } satisfies CreateUserInput)
        : ({
            id: values.id ?? "",
            fullName: values.fullName,
            email: values.email,
            role: values.role,
            status: values.status,
            isLocked: values.isLocked,
            passwordResetRequired: values.passwordResetRequired,
            onboardingNote: values.onboardingNote,
            disabledReason: values.disabledReason,
            sendOnboardingEmail: values.sendOnboardingEmail ?? false,
            password: values.password,
            confirmDestructive: values.confirmDestructive ?? false,
          } satisfies UpdateUserInput)
    ) as never;

    const result = await onSubmit(payload);

    if (!result.success) {
      setServerError(result.error ?? null);
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          form.setError(field as never, {
            type: "server",
            message: messages?.[0] ?? "Invalid value",
          });
        });
      }
      setIsSubmitting(false);
      return;
    }

    form.reset();
    setIsSubmitting(false);
    onOpenChange(false);
  }

  const title = isCreate ? "Invite new user" : "Edit user";
  const description = isCreate
    ? "Collect the required details to create a new user profile. You can send them an onboarding email or set a temporary password."
    : "Update profile details, manage access, and maintain audit notes.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-6"
            onSubmit={form.handleSubmit((values) =>
              handleSubmit(values as never)
            )}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input placeholder="Ada Lovelace" {...field} />
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
                        placeholder="ada@example.com"
                        {...field}
                        disabled={!isCreate}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="isLocked"
                render={({ field }) => (
                  <FormItem className="flex flex-col space-y-2 rounded-md border p-3">
                    <div className="flex items-center justify-between space-x-2">
                      <div>
                        <FormLabel>Lock account</FormLabel>
                        <FormDescription>
                          Prevent this user from signing in.
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

              <FormField
                control={form.control}
                name="passwordResetRequired"
                render={({ field }) => (
                  <FormItem className="flex flex-col space-y-2 rounded-md border p-3">
                    <div className="flex items-center justify-between space-x-2">
                      <div>
                        <FormLabel>Require password reset</FormLabel>
                        <FormDescription>
                          Force a reset on next sign-in.
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
              name="sendOnboardingEmail"
              render={({ field }) => (
                <FormItem className="flex flex-col space-y-2 rounded-md border p-3">
                  <div className="flex items-center justify-between space-x-2">
                    <div>
                      <FormLabel>Send onboarding email</FormLabel>
                      <FormDescription>
                        Send the user a secure link to set their password.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (checked) {
                            form.setValue("password", "");
                          }
                        }}
                        disabled={!isCreate}
                      />
                    </FormControl>
                  </div>
                  {!isCreate ? (
                    <FormDescription>
                      Re-sending the onboarding email can only happen from the
                      table actions.
                    </FormDescription>
                  ) : null}
                  <FormMessage />
                </FormItem>
              )}
            />

            {(!watchedSendOnboarding || !isCreate) && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Temporary password{" "}
                      <span className="text-muted-foreground">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Strong temporary password"
                        {...field}
                        disabled={watchedSendOnboarding && isCreate}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a strong password if you prefer to share it
                      manually. Otherwise, send an onboarding email.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="onboardingNote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internal onboarding note</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Relevant context to guide onboarding..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Visible to admins only. Use this to capture onboarding
                      context.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchedStatus === "disabled" ? (
                <FormField
                  control={form.control}
                  name="disabledReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disable reason</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Explain why access is being revoked..."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This will be stored with the audit trail.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
            </div>

            {!isCreate && destructiveChange ? (
              <FormField
                control={form.control}
                name="confirmDestructive"
                render={({ field }) => (
                  <FormItem className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div>
                      <FormLabel className="flex items-center gap-2 font-medium text-destructive">
                        <ShieldAlert className="h-4 w-4" />
                        Confirm this disruptive change
                      </FormLabel>
                      <FormDescription className="text-sm text-destructive/80">
                        You are disabling, locking, or requiring a password
                        reset for this account. Confirm that you understand this
                        action cannot be undone without manual intervention.
                      </FormDescription>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            ) : null}

            {serverError ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {serverError}
              </div>
            ) : null}

            <DialogFooter className="gap-2">
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
                  ? "Create user"
                  : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default UsersPage;
