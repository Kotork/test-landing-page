import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

import ContactsPage from "@/app/(admin)/admin/contacts/contacts-page";

describe("ContactsPage", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn((url: RequestInfo) => {
      const href = typeof url === "string" ? url : url.toString();
      if (href.includes("newsletter-submissions")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            submissions: [
              {
                id: "nl-1",
                customer_id: null,
                email: "subscriber@example.com",
                name: "Taylor Swift",
                marketing_opt_in: true,
                subscription_status: "subscribed",
                submitted_at: new Date().toISOString(),
                confirmed_at: null,
                unsubscribed_at: null,
                bounce_reason: null,
                is_archived: false,
                archived_at: null,
                archived_by: null,
                archived_reason: null,
                created_by: "admin",
                updated_by: "admin",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ],
            total: 1,
            page: 1,
            pageSize: 20,
          }),
        });
      }

      if (href.includes("contact-submissions")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            submissions: [
              {
                id: "ct-1",
                customer_id: null,
                name: "Ada Lovelace",
                email: "ada@example.com",
                marketing_opt_in: false,
                subject: "Need a walkthrough",
                message: "I'd love a guided tour of the platform.",
                metadata: null,
                status: "new",
                submitted_at: new Date().toISOString(),
                responded_at: null,
                last_follow_up_at: null,
                is_archived: false,
                archived_at: null,
                archived_by: null,
                archived_reason: null,
                created_by: "admin",
                updated_by: "admin",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ],
            total: 1,
            page: 1,
            pageSize: 20,
          }),
        });
      }

      return Promise.resolve({
        ok: false,
        json: async () => ({ error: "unexpected" }),
      });
    });

    // @ts-expect-error - assign mock fetch for tests
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders both tabs and loads data", async () => {
    const user = userEvent.setup();
    render(<ContactsPage />);

    expect(
      screen.getByRole("heading", { name: /contacts & leads/i })
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(
        screen.getByText("subscriber@example.com")
      ).toBeInTheDocument()
    );

    await user.click(screen.getByRole("tab", { name: /contacts/i }));

    await waitFor(() =>
      expect(screen.getByText("Need a walkthrough")).toBeInTheDocument()
    );

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/admin/newsletter-submissions?"),
      expect.any(Object)
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/admin/contact-submissions?"),
      expect.any(Object)
    );
  });
});

