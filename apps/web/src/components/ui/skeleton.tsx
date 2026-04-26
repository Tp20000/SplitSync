// FILE: apps/web/src/components/ui/skeleton.tsx
// PURPOSE: shadcn Skeleton loading placeholder
// DEPENDS ON: tailwind
// LAST UPDATED: F41 - Loading Skeletons

import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };