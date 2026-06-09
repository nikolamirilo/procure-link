"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { Compass } from "lucide-react";

export default function NotFound() {
  const t = useTranslations("errors");

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="text-center space-y-4 max-w-md">
        <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
          <Compass className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-5xl font-bold tracking-tight">404</p>
        <h1 className="text-xl font-semibold">{t("notFoundTitle")}</h1>
        <p className="text-muted-foreground">{t("notFoundBody")}</p>
        <Link href="/" className={buttonVariants({ className: "mt-2" })}>
          {t("goHome")}
        </Link>
      </div>
    </div>
  );
}
