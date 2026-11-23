"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

const LINKS = [
  { href: "/", label: "Parcelles" },
  { href: "/harvests", label: "Saisies" },
  { href: "/results", label: "Résultat" },
] as const;

// The menu. The current section is marked with aria-current and a bold underline (not colour alone).
// Creating an entry starts from the list of plots, so "/harvests/new" belongs to the "Parcelles" section.
export function MainNav() {
  // usePathname() is only known at request time: until then the menu shows without a current section.
  return (
    <Suspense fallback={<NavLinks current={null} />}>
      <NavWithCurrentSection />
    </Suspense>
  );
}

function NavWithCurrentSection() {
  return <NavLinks current={sectionOf(usePathname())} />;
}

function NavLinks({ current }: { current: string | null }) {
  return (
    <nav aria-label="Menu principal">
      <ul className="flex flex-wrap gap-x-1 gap-y-1">
        {LINKS.map(({ href, label }) => {
          const isCurrent = href === current;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isCurrent ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-md px-3 text-sm font-semibold hover:bg-background ${
                  isCurrent ? "text-primary underline decoration-2 underline-offset-8" : "text-foreground"
                }`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function sectionOf(pathname: string): string {
  if (pathname === "/harvests/new") return "/";
  if (pathname.startsWith("/harvests")) return "/harvests";
  if (pathname.startsWith("/results")) return "/results";
  return "/";
}
