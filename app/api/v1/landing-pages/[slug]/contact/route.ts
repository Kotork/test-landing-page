import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateApiKeyRequest } from "@/lib/utils/api-auth";
import {
  contactSubmissionSchema,
  type ContactSubmissionInput,
} from "@/lib/landing-pages/schema";

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    // Validate API key and get landing page data
    const keyData = await validateApiKeyRequest(request);

    // Verify slug matches the API key's landing page
    if (keyData.landingPage.slug !== params.slug) {
      return NextResponse.json(
        { error: "Landing page slug mismatch" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const input = contactSubmissionSchema.parse(body);

    const adminClient = createAdminClient();

    // Create contact submission
    const { data, error } = await adminClient
      .from("contact_submissions")
      .insert({
        organization_id: keyData.organization.id,
        name: input.name?.trim() || null,
        email: input.email,
        subject: input.subject.trim(),
        message: input.message.trim(),
        marketing_opt_in: input.marketingOptIn,
        status: "new",
        submitted_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        {
          error: "Failed to create contact submission",
          details: error?.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === "Missing API key" ||
        error.message === "Invalid API key"
      ) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      if (error.message.includes("Validation failed")) {
        return NextResponse.json(
          { error: "Validation failed", details: error.message },
          { status: 422 }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
