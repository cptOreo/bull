import Link from "next/link";
import { Home, Search, BookOpen } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center space-y-6">
        <div className="text-9xl font-mono font-bold text-muted-foreground/20">404</div>
        <h1 className="text-3xl font-display font-bold">Page not found</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <Home className="h-4 w-4" />
            Go Home
          </Link>
          <Link href="/learn" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-input bg-background hover:bg-accent transition-colors">
            <BookOpen className="h-4 w-4" />
            Browse Lessons
          </Link>
          <Link href="/research" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-input bg-background hover:bg-accent transition-colors">
            <Search className="h-4 w-4" />
            Search Stocks
          </Link>
        </div>
      </div>
    </div>
  );
}