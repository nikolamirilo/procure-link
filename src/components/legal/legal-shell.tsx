import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ArrowLeft } from "lucide-react";

export function LegalShell({
  title,
  subtitle,
  backLabel,
  lastUpdated,
  children,
}: {
  title: string;
  subtitle?: string;
  backLabel: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 glass border-b">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> {backLabel}
            </Link>
          </div>
        </div>
      </nav>
      <main className="max-w-3xl mx-auto px-6 py-16 md:py-20">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-3">{subtitle}</p>}
        <div className="mt-10 space-y-9 text-foreground/90 leading-relaxed [&_h2]:text-xl [&_h2]:font-semibold [&_section]:space-y-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_ul]:text-muted-foreground [&_a]:text-primary hover:[&_a]:underline">
          {children}
        </div>
        <p className="text-muted-foreground text-sm mt-12">{lastUpdated}</p>
      </main>
    </div>
  );
}
