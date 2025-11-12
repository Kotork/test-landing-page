import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, beforeEach, afterEach, it, vi } from "vitest";

import UsersPage from "@/app/(admin)/admin/users/users-page";

const sampleUser = {
  id: "5f41a3ce-3312-4f2f-a1c6-8de6c8011111",
  email: "manager@example.com",
  role: "staff",
  status: "active",
  is_locked: false,
  password_reset_required: false,
  full_name: "Manager One",
  onboarding_note: "",
  disabled_reason: "",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  last_login_at: new Date().toISOString(),
};

describe("UsersPage", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        users: [sampleUser],
        total: 1,
        page: 1,
        pageSize: 20,
      }),
    });
    // @ts-expect-error - attach mock fetch for tests
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders and loads user data", async () => {
    render(<UsersPage />);

    expect(
      screen.getByRole("heading", { name: /user management/i })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    expect(await screen.findByText("manager@example.com")).toBeInTheDocument();
  });

  it("opens the create user dialog when clicking New User", async () => {
    const user = userEvent.setup();
    render(<UsersPage />);

    await user.click(screen.getByRole("button", { name: /new user/i }));

    expect(
      await screen.findByLabelText(/full name/i)
    ).toBeInTheDocument();
  });
});


