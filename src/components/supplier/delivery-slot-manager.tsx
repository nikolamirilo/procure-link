"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  createDeliverySlot,
  deleteDeliverySlot,
} from "@/lib/actions/delivery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Clock, MapPin, Loader2 } from "lucide-react";
import { DAYS_OF_WEEK } from "@/lib/constants";

interface Slot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  zone_name: string | null;
  max_orders: number | null;
  is_active: boolean | null;
}

export function DeliverySlotManager({ slots }: { slots: Slot[] }) {
  const t = useTranslations("deliverySlots");
  const td = useTranslations("days");
  const [dayOfWeek, setDayOfWeek] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  // DAYS_OF_WEEK is index 0=Mon..6=Sun; the days namespace is keyed 1..7.
  const dayName = (index: number) => td(String(index + 1));

  const slotsByDay = DAYS_OF_WEEK.map((day, index) => ({
    day,
    index,
    slots: slots.filter((s) => s.day_of_week === index),
  }));

  async function handleCreate(formData: FormData) {
    setLoading(true);
    setError(null);
    formData.set("dayOfWeek", dayOfWeek);
    const result = await createDeliverySlot(formData);
    if (result?.error) setError(result.error);
    setLoading(false);
  }

  function remove(id: string) {
    startTransition(async () => {
      const r = await deleteDeliverySlot(id);
      if (r?.error) toast.error(r.error);
    });
  }

  return (
    <div className="space-y-6">
      <Dialog>
        <DialogTrigger className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-semibold h-10 px-5 cursor-pointer hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4 mr-2" />
          {t("addSlot")}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("newSlot")}</DialogTitle>
          </DialogHeader>
          <form action={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("dayOfWeek")}</Label>
              <Select value={dayOfWeek} onValueChange={(v) => v && setDayOfWeek(v)}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {dayName(i)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">{t("startTime")}</Label>
                <Input id="startTime" name="startTime" type="time" defaultValue="06:00" className="h-11" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">{t("endTime")}</Label>
                <Input id="endTime" name="endTime" type="time" defaultValue="10:00" className="h-11" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zoneName">{t("zone")}</Label>
                <Input id="zoneName" name="zoneName" placeholder="Zona A" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxOrders">{t("maxOrders")}</Label>
                <Input id="maxOrders" name="maxOrders" type="number" min="1" defaultValue={20} className="h-11" />
              </div>
            </div>
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full h-11 font-semibold gap-2" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? t("creating") : t("addSlot")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {slotsByDay.map(({ day, slots: daySlots, index }) => (
          <div key={day} className="rounded-2xl border bg-card premium-shadow overflow-hidden">
            <div className="px-4 py-3 bg-muted/30 border-b">
              <h3 className="text-sm font-semibold">{dayName(index)}</h3>
              <p className="text-[11px] text-muted-foreground">{t("slots", { count: daySlots.length })}</p>
            </div>
            <div className="p-3 space-y-2 min-h-[80px]">
              {daySlots.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">{t("noDeliveries")}</p>
              ) : (
                daySlots.map((slot) => (
                  <div key={slot.id} className="group flex items-center justify-between rounded-xl border px-3 py-2.5 hover:bg-muted/30 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-sm font-medium">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                      </div>
                      <div className="flex items-center gap-2">
                        {slot.zone_name && (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <MapPin className="h-2.5 w-2.5" />
                            {slot.zone_name}
                          </span>
                        )}
                        <span className="text-[11px] text-muted-foreground">{t("max")} {slot.max_orders ?? 20}</span>
                      </div>
                    </div>
                    <ConfirmDialog
                      trigger={
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      }
                      title={t("deleteTitle")}
                      description={t("deleteBody")}
                      confirmLabel={t("deleteTitle")}
                      variant="destructive"
                      onConfirm={() => remove(slot.id)}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
