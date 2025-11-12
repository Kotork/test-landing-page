import type { Metadata } from "next";

import ContactsPage from "./contacts-page";

export const metadata: Metadata = {
  title: "Contacts Management",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminContactsRoute() {
  return <ContactsPage />;
}


