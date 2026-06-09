import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { defaultLocale, isLocale } from "./config";

// Cookie-based locale (no URL prefix) - keeps /supplier and /restaurant paths
// clean. Serbian is the default; the language switcher writes the cookie.
export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieLocale = store.get("NEXT_LOCALE")?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
