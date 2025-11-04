import Link from "next/link";

/**
 * Global 404 Not Found Page
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-lg w-full text-center">
        <div className="text-6xl mb-4">404</div>
        <h1 className="text-3xl font-bold mb-2">Page Not Found</h1>
        <p className="text-text-secondary mb-6">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been
          moved or deleted.
        </p>
        <Link href="/dashboard" className="btn-primary inline-block">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
