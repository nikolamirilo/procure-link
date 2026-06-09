"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  useEffect(() => {
    // Surfaced to the observability layer (Sentry) in Workstream H.
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center space-y-4 max-w-md">
        <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
          <AlertTriangle className="h-7 w-7 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("body")}</p>
        <Button onClick={reset} className="mt-2">
          {t("retry")}
        </Button>
      </div>
    </div>
  );
}
