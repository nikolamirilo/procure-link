"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  createDeliverySlot,
  updateDeliverySlot,
  deleteDeliverySlot,
} from "@/lib/actions/delivery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  Plus,
  Trash2,
  Clock,
  MapPin,
  Loader2,
  Pencil,
  Pause,
  Play,
} from "lucide-react";
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

/** Builds the FormData updateDeliverySlot expects from a slot record. */
function slotFormData(slot: Slot, overrides?: Partial<Record<string, string>>) {
  const fd = new FormData();
  fd.set("dayOfWeek", String(slot.day_of_week));
  fd.set("startTime", slot.start_time.slice(0, 5));
  fd.set("endTime", slot.end_time.slice(0, 5));
  fd.set("zoneName", slot.zone_name ?? "");
  fd.set("maxOrders", String(slot.max_orders ?? 20));
  fd.set("isActive", String(slot.is_active !== false));
  for (const [k, v] of Object.entries(overrides ?? {})) fd.set(k, v ?? "");
  return fd;
}

/** Shared create/edit form body. */
function SlotForm({
  slot,
  onSubmit,
  loading,
  error,
  submitLabel,
  loadingLabel,
}: {
  slot?: Slot;
  onSubmit: (formData: FormData) => void;
  loading: boolean;
  error: string | null;
  submitLabel: string;
  loadingLabel: string;
}) {
  const t = useTranslations("deliverySlots");
  const td = useTranslations("days");
  const [dayOfWeek, setDayOfWeek] = useState(String(slot?.day_of_week ?? 0));
  const dayName = (index: number) => td(String(index + 1));

  function handle(formData: FormData) {
    formData.set("dayOfWeek", dayOfWeek);
    if (slot) formData.set("isActive", String(slot.is_active !== false));
    onSubmit(formData);
  }

  return (
    <form action={handle} className="space-y-4">
      <div className="space-y-2">
        <Label>{t("dayOfWeek")}</Label>
        <Select value={dayOfWeek} onValueChange={(v) => v && setDayOfWeek(v)}>
          <SelectTrigger className="h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DAYS_OF_WEEK.map((_, i) => (
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
          <Input
            id="startTime"
            name="startTime"
            type="time"
            defaultValue={slot?.start_time.slice(0, 5) ?? "06:00"}
            className="h-11"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">{t("endTime")}</Label>
          <Input
            id="endTime"
            name="endTime"
            type="time"
            defaultValue={slot?.end_time.slice(0, 5) ?? "10:00"}
            className="h-11"
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="zoneName">{t("zone")}</Label>
          <Input
            id="zoneName"
            name="zoneName"
            defaultValue={slot?.zone_name ?? ""}
            placeholder="Zona A"
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxOrders">{t("maxOrders")}</Label>
          <Input
            id="maxOrders"
            name="maxOrders"
            type="number"
            min="1"
            defaultValue={slot?.max_orders ?? 20}
            className="h-11"
          />
        </div>
      </div>
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <Button type="submit" className="w-full h-11 font-semibold gap-2" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? loadingLabel : submitLabel}
      </Button>
    </form>
  );
}

export function DeliverySlotManager({ slots }: { slots: Slot[] }) {
  const t = useTranslations("deliverySlots");
  const td = useTranslations("days");
  const [createOpen, setCreateOpen] = useState(false);
  const [editSlot, setEditSlot] = useState<Slot | null>(null);
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
    const result = await createDeliverySlot(formData);
    setLoading(false);
    if (result?.error) setError(result.error);
    else setCreateOpen(false);
  }

  async function handleUpdate(formData: FormData) {
    if (!editSlot) return;
    setLoading(true);
    setError(null);
    const result = await updateDeliverySlot(editSlot.id, formData);
    setLoading(false);
    if (result?.error) setError(result.error);
    else setEditSlot(null);
  }

  /** Pause/resume without deleting - seasonal suppliers need this weekly. */
  function toggleActive(slot: Slot) {
    startTransition(async () => {
      const r = await updateDeliverySlot(
        slot.id,
        slotFormData(slot, { isActive: String(slot.is_active === false) })
      );
      if (r?.error) toast.error(r.error);
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const r = await deleteDeliverySlot(id);
      if (r?.error) toast.error(r.error);
    });
  }

  return (
    <div className="space-y-6">
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogTrigger className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-semibold h-10 px-5 cursor-pointer hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4 mr-2" />
          {t("addSlot")}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("newSlot")}</DialogTitle>
          </DialogHeader>
          <SlotForm
            onSubmit={handleCreate}
            loading={loading}
            error={error}
            submitLabel={t("addSlot")}
            loadingLabel={t("creating")}
          />
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
                daySlots.map((slot) => {
                  const paused = slot.is_active === false;
                  return (
                    <div
                      key={slot.id}
                      className={`group flex items-center justify-between rounded-xl border px-3 py-2.5 hover:bg-muted/30 transition-colors ${
                        paused ? "opacity-60" : ""
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-sm font-medium">
                          <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                          {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                          {paused && (
                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                              {t("pausedBadge")}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {slot.zone_name && (
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground truncate">
                              <MapPin className="h-2.5 w-2.5 shrink-0" />
                              {slot.zone_name}
                            </span>
                          )}
                          <span className="text-[11px] text-muted-foreground shrink-0">
                            {t("max")} {slot.max_orders ?? 20}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground"
                          title={paused ? t("activate") : t("deactivate")}
                          onClick={() => toggleActive(slot)}
                        >
                          {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground"
                          title={t("editSlot")}
                          onClick={() => {
                            setError(null);
                            setEditSlot(slot);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <ConfirmDialog
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              title={t("deleteTitle")}
                            >
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
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editSlot} onOpenChange={(o) => !o && setEditSlot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editSlot")}</DialogTitle>
          </DialogHeader>
          {editSlot && (
            <SlotForm
              slot={editSlot}
              onSubmit={handleUpdate}
              loading={loading}
              error={error}
              submitLabel={t("saveSlot")}
              loadingLabel={t("creating")}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
