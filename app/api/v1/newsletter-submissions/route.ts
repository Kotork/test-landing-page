import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  createNewsletterSubmission,
  listNewsletterSubmissions,
  serializeContactsError,
} from "@/lib/server/contacts/service";
import { requireAuth } from "@/lib/utils/auth";

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
    const admin = await requireAuth("staff");
    void admin;

    const supabase = await createClient();
    const searchParams = Object.fromEntries(
      new URL(request.url).searchParams.entries()
    );

    const response = await listNewsletterSubmissions({
      supabase,
      query: searchParams,
    });

    return NextResponse.json(response);
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

    const serialized = serializeContactsError(error);
    return NextResponse.json(serialized.body, { status: serialized.status });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAuth("staff");
    const supabase = await createClient();
    const payload = await request.json();

    const submission = await createNewsletterSubmission({
      supabase,
      payload,
      actingUserId: admin.id,
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

    const serialized = serializeContactsError(error);
    return NextResponse.json(serialized.body, { status: serialized.status });
  }
}
