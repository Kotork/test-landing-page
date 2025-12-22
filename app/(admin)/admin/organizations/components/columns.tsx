"use client";

import { DataTableColumnHeader } from "@/components/data-table/components/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useToast } from "@/components/ui/use-toast";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Organization } from "../hooks/use-organizations";
import { useDeleteOrganization } from "../hooks/use-organization";

export type OrganizationColumn = Organization;

function RowActions({ organization }: { organization: Organization }) {
  const router = useRouter();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { mutateAsync: deleteOrg, isPending: isDeleting } = useDeleteOrganization();

  const handleDelete = async () => {
    try {
      await deleteOrg(organization.id);
      toast({
        title: "Success",
        description: "Organization deleted successfully",
      });
      setDeleteDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete organization",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() =>
              router.push(`/admin/organizations/${organization.id}`)
            }
          >
            View details
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => navigator.clipboard.writeText(organization.id)}
          >
            Copy organization ID
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => navigator.clipboard.writeText(organization.subdomain)}
          >
            Copy subdomain
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
            <AlertDialogTitle>Delete organization?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{organization.name}" and all
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

export const columns: ColumnDef<OrganizationColumn>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const organization = row.original;
      return (
        <div className="flex items-center gap-3">
          {organization.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={organization.logo_url}
              alt={organization.name}
              className="h-8 w-8 rounded object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}
          <span className="font-medium">{organization.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "subdomain",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Subdomain" />
    ),
    cell: ({ row }) => {
      const subdomain = row.getValue("subdomain") as string;
      return <span className="font-mono text-sm">{subdomain}</span>;
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return (
        <div className="text-sm">
          {date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </div>
      );
    },
  },
  {
    accessorKey: "updated_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Updated" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("updated_at"));
      return (
        <div className="text-sm text-muted-foreground">
          {date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const organization = row.original;
      return <RowActions organization={organization} />;
    },
  },
];
