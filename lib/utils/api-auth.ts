import { createAdminClient } from "@/lib/supabase/admin";
import { hashApiKey, verifyApiKey } from "./api-key-generator";

export interface ApiKeyData {
  landingPage: {
    id: string;
    organizationId: string;
    slug: string;
    name: string;
    isActive: boolean;
  };
  organization: {
    id: string;
    name: string;
  };
  apiKey: {
    id: string;
    name: string;
    lastUsedAt: string | null;
  };
}

/**
 * Validate an API key and return associated data
 * Uses admin client to bypass RLS for key validation
 */
export async function validateApiKey(
  apiKey: string
): Promise<ApiKeyData | null> {
  try {
    const adminClient = createAdminClient();
    const keyHash = hashApiKey(apiKey);

    // Fetch API key with related landing page and organization data
    const { data, error } = await adminClient
      .from("api_keys")
      .select(
        `
        id,
        key_hash,
        name,
        last_used_at,
        is_active,
        expires_at,
        landing_page_id,
        landing_pages!inner (
          id,
          organization_id,
          slug,
          name,
          is_active,
          organizations!inner (
            id,
            name
          )
        )
      `
      )
      .eq("key_hash", keyHash)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    // Verify the hash matches (double-check)
    if (!verifyApiKey(apiKey, data.key_hash)) {
      return null;
    }

    // Check if key is expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return null;
    }

    // Check if landing page is active
    const landingPage = data.landing_pages as any;
    if (!landingPage.is_active) {
      return null;
    }

    // Update last_used_at timestamp
    await adminClient
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", data.id);

    return {
      landingPage: {
        id: landingPage.id,
        organizationId: landingPage.organization_id,
        slug: landingPage.slug,
        name: landingPage.name,
        isActive: landingPage.is_active,
      },
      organization: {
        id: landingPage.organizations.id,
        name: landingPage.organizations.name,
      },
      apiKey: {
        id: data.id,
        name: data.name,
        lastUsedAt: data.last_used_at,
      },
    };
  } catch (error) {
    console.error("[validateApiKey] Error:", error);
    return null;
  }
}

/**
 * Validate API key from request headers
 * Throws error if invalid
 */
export async function validateApiKeyRequest(
  request: Request
): Promise<ApiKeyData> {
  const authHeader = request.headers.get("Authorization");
  const apiKey = authHeader?.replace(/^Bearer\s+/i, "");

  if (!apiKey) {
    throw new Error("Missing API key");
  }

  const keyData = await validateApiKey(apiKey);
  if (!keyData) {
    throw new Error("Invalid API key");
  }

  return keyData;
}
