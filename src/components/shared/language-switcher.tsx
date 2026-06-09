"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Globe, Check } from "lucide-react";
import { setLocale } from "@/i18n/actions";
import { locales, type Locale } from "@/i18n/config";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const active = useLocale() as Locale;
  const t = useTranslations("language");
  const [pending, startTransition] = useTransition();

  function choose(locale: Locale) {
    if (locale === active) return;
    startTransition(() => setLocale(locale));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("label")}
        disabled={pending}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer",
          className
        )}
      >
        <Globe className="h-4 w-4" />
        <span className="uppercase">{active}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => choose(locale)}
            className="justify-between"
          >
            {t(locale)}
            {locale === active && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
