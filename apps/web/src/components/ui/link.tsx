// FILE: apps/web/src/components/ui/link.tsx
// PURPOSE: Next.js Link wrapper for shadcn compatibility
// DEPENDS ON: next/link
// LAST UPDATED: F08 - Login & Register Pages

import Link from "next/link";
import { forwardRef } from "react";

const LinkComponent = forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement>
>((props, ref) => <Link ref={ref} {...props} />);

LinkComponent.displayName = "Link";

export { LinkComponent as Link };