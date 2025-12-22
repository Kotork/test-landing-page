import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateApiKeyRequest } from "@/lib/utils/api-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Validate API key and get landing page data
    const keyData = await validateApiKeyRequest(request);
    const { slug } = await params;

    // Verify slug matches the API key's landing page
    if (keyData.landingPage.slug !== slug) {
      return NextResponse.json(
        { error: "Landing page slug mismatch" },
        { status: 403 }
      );
    }

    const adminClient = createAdminClient();

    // Get analytics data (submissions count by type)
    const { data: submissions, error } = await adminClient
      .from("landing_page_submissions")
      .select("submission_type, created_at")
      .eq("landing_page_id", keyData.landingPage.id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch analytics", details: error.message },
        { status: 500 }
      );
    }

    // Aggregate analytics
    const analytics = {
      totalSubmissions: submissions?.length ?? 0,
      byType: {
        newsletter:
          submissions?.filter((s) => s.submission_type === "newsletter")
            .length ?? 0,
        contact:
          submissions?.filter((s) => s.submission_type === "contact").length ??
          0,
        analytics:
          submissions?.filter((s) => s.submission_type === "analytics")
            .length ?? 0,
        custom:
          submissions?.filter((s) => s.submission_type === "custom").length ??
          0,
      },
      recentSubmissions:
        submissions?.slice(-10).map((s) => ({
          type: s.submission_type,
          createdAt: s.created_at,
        })) ?? [],
    };

    return NextResponse.json(analytics);
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === "Missing API key" ||
        error.message === "Invalid API key"
      ) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
