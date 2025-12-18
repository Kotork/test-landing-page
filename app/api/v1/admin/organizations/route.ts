import { createClient } from "@/lib/supabase/server";
import {
  listOrganizations,
  createOrganization,
  serializeOrganizationError,
} from "@/lib/organizations/service";
import { requireAuth } from "@/lib/utils/auth";
import { NextResponse } from "next/server";

function handleAuthError(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return null;
}

export async function GET(request: Request) {
  try {
    const staffUser = await requireAuth("staff");
    void staffUser;
    const supabase = await createClient();

    const searchParams = Object.fromEntries(
      new URL(request.url).searchParams.entries()
    );

    const response = await listOrganizations({
      supabase,
      query: searchParams,
    });

    return NextResponse.json(response);
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

    const serialized = serializeOrganizationError(error);
    return NextResponse.json(serialized.body, { status: serialized.status });
  }
}

export async function POST(request: Request) {
  try {
    const staffUser = await requireAuth("staff");
    const supabase = await createClient();
    const payload = await request.json();

    const organization = await createOrganization({
      supabase,
      payload,
      actingUserId: staffUser.id,
    });

    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

    const serialized = serializeOrganizationError(error);
    return NextResponse.json(serialized.body, { status: serialized.status });
  }
}
