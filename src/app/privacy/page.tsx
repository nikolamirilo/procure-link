import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy - ProcureLink",
  description: "Draft privacy policy for the ProcureLink private beta.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 glass border-b">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to home
          </Link>
        </div>
      </nav>
      <main className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <div className="space-y-6">
          <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold text-primary bg-primary/5">
            DRAFT - BETA
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground">
            This is a draft notice for the private beta. The full policy will be published before ProcureLink leaves beta.
          </p>
        </div>

        <div className="mt-12 space-y-10 text-foreground/90 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Who we are</h2>
            <p>
              ProcureLink is a B2B procurement platform connecting restaurants and suppliers. The platform is operated by the ProcureLink team. For any privacy question, email <a href="mailto:hello@procure-link.com" className="text-primary hover:underline">hello@procure-link.com</a>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">What we collect</h2>
            <p>
              When you join the beta we collect business contact data: your full name, work email, the name and address of your restaurant or supply business, business phone, and the products or categories you operate in. We do not collect personal data beyond what is necessary to run a B2B account.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Why we collect it</h2>
            <p>
              We process this data on the lawful basis of contract performance: providing the ProcureLink service to you. We do not sell data to third parties and we do not use it for advertising.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Who processes it</h2>
            <p>
              We use the following processors to run the platform:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Supabase (database and authentication, EU region)</li>
              <li>Vercel (application hosting)</li>
              <li>Resend (transactional email)</li>
              <li>Sentry (error monitoring)</li>
              <li>UptimeRobot (availability monitoring)</li>
            </ul>
            <p className="text-muted-foreground">
              Each processor handles data under their own DPA which we are in the process of finalising for the full launch.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Your rights</h2>
            <p>
              You can request a copy of your data, correct it, or have it deleted at any time by emailing <a href="mailto:hello@procure-link.com" className="text-primary hover:underline">hello@procure-link.com</a>. We aim to respond within 7 days during beta.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Changes</h2>
            <p>
              The full version of this policy will be published before ProcureLink leaves beta. We will notify all pilot members by email when it does.
            </p>
            <p className="text-muted-foreground text-sm">
              Last updated: 2026-05-28
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
