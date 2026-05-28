import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service - ProcureLink",
  description: "Draft terms of service for the ProcureLink private beta.",
};

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="text-muted-foreground">
            This is a draft notice for the private beta. Full terms will be published before ProcureLink leaves beta.
          </p>
        </div>

        <div className="mt-12 space-y-10 text-foreground/90 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">What ProcureLink is</h2>
            <p>
              ProcureLink is a software platform that lets restaurants and suppliers transact with each other. We are not a party to any sale between a restaurant and a supplier. We do not own, sell, or guarantee the products listed.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Beta access</h2>
            <p>
              The beta is provided free of charge while it lasts. We may add, remove, or change features as we learn. We may end an individual account if it is used to abuse the platform or breach these terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Your responsibilities</h2>
            <p>
              If you are a restaurant, you are responsible for paying suppliers for the orders you place. If you are a supplier, you are responsible for fulfilling orders as listed in your catalog.
            </p>
            <p>
              Both sides are responsible for following the food safety, licensing, and tax laws that apply where they operate.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Disputes between restaurants and suppliers</h2>
            <p>
              If something goes wrong with a delivery - missing items, quality issues, payment disputes - the parties should resolve it between themselves. ProcureLink will provide the order audit trail if asked, but is not the arbiter of commercial disputes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Commission and platform fees</h2>
            <p>
              During the beta there is no platform fee. After the beta we intend to charge suppliers a software fee for using the platform. Pilot members will receive 50% off the published price for as long as their account is active.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Liability</h2>
            <p>
              The platform is provided "as is" during the beta. We aim for reliable uptime but do not yet guarantee a service-level agreement. We will not be liable for indirect or consequential losses arising from beta use.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Contact</h2>
            <p>
              For any question about these terms, email <a href="mailto:hello@procure-link.com" className="text-primary hover:underline">hello@procure-link.com</a>.
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
