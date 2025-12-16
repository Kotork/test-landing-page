import type { Metadata } from "next";

import UsersPage from "./users-page";

export const metadata: Metadata = {
  title: "User Management",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminUsersRoute() {
  return <UsersPage />;
}
