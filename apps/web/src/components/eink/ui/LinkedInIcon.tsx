import type { SVGProps } from "react";

/**
 * LinkedIn brand icon. Simple Icons removed LinkedIn from its catalog
 * (v13.3.0+) over LinkedIn's trademark policy, and the pinned version
 * of `lucide-react` doesn't expose one either. We inline the path from
 * LinkedIn's brand assets so the contact row still gets a matching
 * mark without a runtime dependency.
 *
 * API mirrors lucide / react-simple-icons (`size`, currentColor fill)
 * so it can sit in the same icon map as the rest.
 */
type Props = SVGProps<SVGSVGElement> & { size?: number };

export default function LinkedInIcon({ size = 16, ...rest }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      {...rest}
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}
