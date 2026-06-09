export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { DeliverySlotManager } from "@/components/supplier/delivery-slot-manager";

export default async function DeliveryPage() {
  const supabase = await createClient();
  const t = await getTranslations("pageHeaders");
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user!.id)
    .single();

  const { data: slots } = await supabase
    .from("delivery_slots")
    .select("*")
    .eq("supplier_id", profile!.company_id!)
    .order("day_of_week")
    .order("start_time");

  return (
    <div className="space-y-6">
      <PageHeader title={t("deliveryTitle")} description={t("deliveryDesc")} />
      <DeliverySlotManager slots={slots ?? []} />
    </div>
  );
}
