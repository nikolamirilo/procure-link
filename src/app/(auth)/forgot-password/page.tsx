"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { requestPasswordReset } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/logo";
import { Loader2, MailCheck } from "lucide-react";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full h-11 text-sm font-semibold gap-2" disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {label}
    </Button>
  );
}

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const [sent, setSent] = useState(false);

  async function handle(formData: FormData) {
    await requestPasswordReset(formData);
    setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t("forgotTitle")}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("forgotBody")}</p>
        </div>

        {sent ? (
          <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-4 text-sm flex items-start gap-3">
            <MailCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <span>{t("resetLinkSent")}</span>
          </div>
        ) : (
          <form action={handle} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" className="h-11" required />
            </div>
            <SubmitButton label={t("resetPasswordCta")} />
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary font-medium hover:underline">
            {t("backToLogin")}
          </Link>
        </p>
      </div>
    </div>
  );
}
