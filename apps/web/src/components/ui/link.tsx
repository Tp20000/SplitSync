// FILE: apps/web/src/components/ui/link.tsx
// PURPOSE: Next.js Link wrapper for shadcn compatibility
// DEPENDS ON: next/link
// LAST UPDATED: F47 Fix - href type compatibility

import NextLink from "next/link";
import type { ComponentProps } from "react";

type LinkProps = ComponentProps<typeof NextLink>;

export const Link = NextLink;
export type { LinkProps };