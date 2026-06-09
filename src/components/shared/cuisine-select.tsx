"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

// Stable keys stored in the DB (cuisine_type). "Drugo"/Other stores the raw
// custom text instead of a key.
export const CUISINE_KEYS = [
  "homemade",
  "italian",
  "mediterranean",
  "asian",
  "chinese",
  "japanese",
  "mexican",
  "american",
  "grill",
  "bakery",
  "pastry",
  "pizzeria",
  "vegetarian",
  "seafood",
  "cafe",
] as const;

/**
 * Cuisine-type picker: a dropdown of common cuisines plus an "Other" option
 * that reveals a free-text input. Renders a hidden input (for FormData-based
 * forms) and calls onChange (for controlled forms). The resolved value is the
 * key for a known cuisine, or the raw custom text when "Other" is chosen.
 */
export function CuisineSelect({
  name,
  defaultValue = "",
  onChange,
}: {
  name?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}) {
  const t = useTranslations("cuisines");
  const isKnown = (CUISINE_KEYS as readonly string[]).includes(defaultValue);
  const [selection, setSelection] = useState<string>(
    defaultValue ? (isKnown ? defaultValue : "other") : ""
  );
  const [custom, setCustom] = useState<string>(isKnown ? "" : defaultValue);

  const resolved = selection === "other" ? custom : selection;

  function handleSelect(v: string) {
    setSelection(v);
    onChange?.(v === "other" ? custom : v);
  }

  function handleCustom(v: string) {
    setCustom(v);
    onChange?.(v);
  }

  return (
    <div className="space-y-2">
      {name && <input type="hidden" name={name} value={resolved} />}
      <Select value={selection} onValueChange={(v) => v && handleSelect(v)}>
        <SelectTrigger>
          <SelectValue placeholder={t("placeholder")} />
        </SelectTrigger>
        <SelectContent>
          {CUISINE_KEYS.map((k) => (
            <SelectItem key={k} value={k}>
              {t(k)}
            </SelectItem>
          ))}
          <SelectItem value="other">{t("other")}</SelectItem>
        </SelectContent>
      </Select>
      {selection === "other" && (
        <Input
          value={custom}
          onChange={(e) => handleCustom(e.target.value)}
          placeholder={t("otherPlaceholder")}
        />
      )}
    </div>
  );
}
