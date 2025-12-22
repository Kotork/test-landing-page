import { createClient } from "@/lib/supabase/server";
import {
    getOrganization,
    updateOrganization,
    deleteOrganization,
    serializeOrganizationError,
} from "@/lib/server/organizations/service";
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

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAuth("staff");
        const { id } = await params;

        const supabase = await createClient();
        const organization = await getOrganization(supabase, id);

        return NextResponse.json(organization);
    } catch (error) {
        const authResponse = handleAuthError(error);
        if (authResponse) return authResponse;

        const serialized = serializeOrganizationError(error);
        return NextResponse.json(serialized.body, { status: serialized.status });
    }
}


export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const staffUser = await requireAuth("staff");
        const { id } = await params;

        const supabase = await createClient();
        const payload = await request.json();

        // Ensure the ID matches the route
        payload.id = id;

        const updated = await updateOrganization({
            supabase,
            payload,
            actingUserId: staffUser.id,
        });

        return NextResponse.json(updated);
    } catch (error) {
        const authResponse = handleAuthError(error);
        if (authResponse) return authResponse;

        const serialized = serializeOrganizationError(error);
        return NextResponse.json(serialized.body, { status: serialized.status });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAuth("staff");
        const { id } = await params;

        const supabase = await createClient();
        await deleteOrganization(supabase, id);

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        const authResponse = handleAuthError(error);
        if (authResponse) return authResponse;

        const serialized = serializeOrganizationError(error);
        return NextResponse.json(serialized.body, { status: serialized.status });
    }
}
