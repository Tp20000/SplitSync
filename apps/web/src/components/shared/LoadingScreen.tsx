// FILE: apps/web/src/components/shared/LoadingScreen.tsx
// PURPOSE: Full-page loading screen while auth is initializing
// DEPENDS ON: tailwind
// LAST UPDATED: F09 - Auth State Management

export function LoadingScreen() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 animate-pulse rounded-lg bg-brand-500 p-2 text-xl font-bold text-white">
            S
          </div>
          <span className="text-2xl font-bold tracking-tight">
            SplitSync
          </span>
        </div>

        {/* Spinner */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Loading your session...
        </div>
      </div>
    </div>
  );
}