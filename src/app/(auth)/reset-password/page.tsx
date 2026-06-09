"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { updatePassword } from "@/lib/actions/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/logo";
import { Loader2, CheckCircle2 } from "lucide-react";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full h-11 text-sm font-semibold gap-2" disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {label}
    </Button>
  );
}

export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handle(formData: FormData) {
    setError(null);
    const result = await updatePassword(formData);
    if (result?.error) setError(result.error);
    else setDone(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t("resetPassword")}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("setNewPasswordBody")}</p>
        </div>

        {done ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-4 text-sm flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <span>{t("passwordUpdated")}</span>
            </div>
            <Link href="/login" className={buttonVariants({ className: "w-full h-11 text-sm font-semibold" })}>
              {t("backToLogin")}
            </Link>
          </div>
        ) : (
          <form action={handle} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t("newPassword")}</Label>
              <Input id="password" name="password" type="password" className="h-11" minLength={8} required />
            </div>
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <SubmitButton label={t("updatePasswordCta")} />
          </form>
        )}
      </div>
    </div>
  );
}
