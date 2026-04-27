

import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2"
          >
            <div className="h-10 w-10 rounded-lg bg-brand-500 p-2 text-2xl font-bold text-white flex items-center justify-center">
              S
            </div>
            <span className="text-3xl font-bold tracking-tight text-foreground">
              SplitSync
            </span>
          </Link>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}