"use client";

import { columns, OrganizationColumn } from "./components/columns";
import { DataTable } from "../../../../components/data-table/data-table";
import { useOrganizations } from "./hooks/use-organizations";

export default function Page() {
  const { data, isLoading, error } = useOrganizations();

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">Loading organizations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center text-destructive">
          Error loading organizations: {error.message}
        </div>
      </div>
    );
  }

  const handleAddNew = () => {
    console.log("Add New");
  };

  return (
    <div className="container mx-auto py-10">
      <DataTable<OrganizationColumn, unknown>
        columns={columns}
        data={data || []}
        primaryAction={{
          label: "Add New",
          onClick: () => handleAddNew(),
        }}
        secondaryAction={{
          label: "Delete",
          onClick: () => handleAddNew(),
        }}
      />
    </div>
  );
}
