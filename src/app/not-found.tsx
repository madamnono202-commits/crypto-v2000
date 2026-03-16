import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Home, Search, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you are looking for does not exist or has been moved.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <Section>
      <div className="flex flex-col items-center justify-center text-center space-y-6 py-20">
        <div className="text-6xl font-bold text-muted-foreground/30">404</div>
        <div className="space-y-2 max-w-md">
          <h1 className="text-2xl font-bold tracking-tight">
            Page Not Found
          </h1>
          <p className="text-muted-foreground">
            The page you are looking for does not exist, has been moved, or is
            temporarily unavailable.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/compare">
              <Search className="mr-2 h-4 w-4" />
              Compare Exchanges
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Read Blog
            </Link>
          </Button>
        </div>
      </div>
    </Section>
  );
}
