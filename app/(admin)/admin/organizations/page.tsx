import { columns, Payment } from "./components/columns";
import { DataTable } from "./components/data-table";
import { headers } from "next/headers";

async function getData(): Promise<Payment[]> {
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const baseUrl = `${protocol}://${host}`;

  const response = await fetch(`${baseUrl}/api/v1/admin/organizations`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch organizations");
  }

  const data = await response.json();
  return data.organizations || [];
}

export default async function Page() {
  const data = await getData();

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  );
}
