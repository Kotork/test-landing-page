import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  serializeContactsError,
  updateContactSubmission,
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

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAuth("staff");
    const supabase = await createClient();
    const payload = await request.json();

    const submission = await updateContactSubmission({
      supabase,
      payload: { ...payload, id: params.id },
      actingUserId: admin.id,
    });

    return NextResponse.json(submission);
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

    const serialized = serializeContactsError(error);
    return NextResponse.json(serialized.body, { status: serialized.status });
  }
}
