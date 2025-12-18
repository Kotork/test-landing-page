import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  serializeValidationError,
  updateUser,
} from "@/lib/server/users/service";
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

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const staffUser = await requireAuth("staff");
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const payload = await request.json();

    const user = await updateUser({
      supabase,
      adminClient,
      payload: {
        ...payload,
        id: params.id,
      },
      actingUserId: staffUser.id,
    });

    return NextResponse.json(user);
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

    const serialized = serializeValidationError(error);
    return NextResponse.json(serialized.body, { status: serialized.status });
  }
}
