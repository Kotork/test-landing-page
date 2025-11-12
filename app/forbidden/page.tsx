export const metadata = {
  title: "Access denied",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-24">
      <div className="max-w-md space-y-4 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-destructive">
          403 Forbidden
        </p>
        <h1 className="text-3xl font-semibold">You don&apos;t have access</h1>
        <p className="text-muted-foreground">
          Your account doesn&apos;t have permission to view this area. If you
          believe this is a mistake, contact an administrator to request access.
        </p>
        <a
          className="text-primary underline transition hover:text-primary/80"
          href="/"
        >
          Return to home
        </a>
      </div>
    </main>
  );
}


