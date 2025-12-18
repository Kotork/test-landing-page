import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateApiKeyRequest } from "@/lib/utils/api-auth";
import {
  customSubmissionSchema,
  type CustomSubmissionInput,
} from "@/lib/server/landing-pages/schema";

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
    const input = customSubmissionSchema.parse(body);

    const adminClient = createAdminClient();

    // Create custom submission
    const { data, error } = await adminClient
      .from("landing_page_submissions")
      .insert({
        landing_page_id: keyData.landingPage.id,
        data: input.data,
        submission_type: input.submissionType,
      })
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Failed to create submission", details: error?.message },
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
