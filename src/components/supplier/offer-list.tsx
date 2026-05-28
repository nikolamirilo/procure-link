"use client";

import { useState } from "react";
import { createOffer, deleteOffer } from "@/lib/actions/delivery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Trash2, Tag, Clock, Percent } from "lucide-react";

interface Offer {
  id: string;
  product_id: string;
  discount_pct: number;
  start_date: string;
  end_date: string;
  is_active: boolean | null;
  products: {
    id: string;
    name: string;
    price: number;
    supplier_id: string;
  } | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
}

export function OfferList({
  offers,
  products,
}: {
  offers: Offer[];
  products: Product[];
}) {
  const [productId, setProductId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validOffers = offers.filter((o) => o.products !== null);
  const now = new Date();

  async function handleCreate(formData: FormData) {
    setLoading(true);
    setError(null);
    formData.set("productId", productId);
    const result = await createOffer(formData);
    if (result?.error) setError(result.error);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <Dialog>
        <DialogTrigger className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-semibold h-10 px-5 cursor-pointer hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4 mr-2" />
          Create Offer
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Promotion</DialogTitle>
          </DialogHeader>
          <form action={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Product</Label>
              <Select
                value={productId}
                onValueChange={(v) => v && setProductId(v)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} (EUR {p.price.toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountPct">Discount %</Label>
              <Input
                id="discountPct"
                name="discountPct"
                type="number"
                step="0.5"
                min="0.5"
                max="100"
                placeholder="10"
                className="h-11"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  className="h-11"
                  required
                />
              </div>
            </div>
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full h-11 font-semibold"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Offer"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {validOffers.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto">
            <Tag className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">No offers yet</p>
          <p className="text-sm text-muted-foreground">
            Create your first promotion to attract restaurants
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {validOffers.map((offer) => {
            const isActive =
              offer.is_active &&
              new Date(offer.start_date) <= now &&
              new Date(offer.end_date) >= now;
            const originalPrice = offer.products?.price ?? 0;
            const discountedPrice =
              originalPrice * (1 - offer.discount_pct / 100);
            const daysLeft = Math.ceil(
              (new Date(offer.end_date).getTime() - now.getTime()) /
                (1000 * 60 * 60 * 24)
            );

            return (
              <div
                key={offer.id}
                className="group relative rounded-2xl border bg-card premium-shadow overflow-hidden transition-all duration-300 hover:premium-shadow-lg hover:-translate-y-0.5"
              >
                {/* Gradient banner with discount */}
                <div
                  className={`relative h-28 flex items-center justify-center ${
                    isActive
                      ? "bg-gradient-to-br from-primary via-primary/90 to-brand-700"
                      : "bg-gradient-to-br from-muted-foreground/30 via-muted-foreground/20 to-muted-foreground/10"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-4xl font-black text-white tracking-tight">
                      {offer.discount_pct}%
                    </div>
                    <div className="text-white/80 text-sm font-medium">OFF</div>
                  </div>
                  {/* Status badge */}
                  <div className="absolute top-3 right-3">
                    <Badge
                      className={
                        isActive
                          ? "bg-white/20 text-white border-white/30 backdrop-blur-sm"
                          : "bg-white/60 text-foreground/60"
                      }
                    >
                      {isActive ? "Active" : "Expired"}
                    </Badge>
                  </div>
                  {/* Delete button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-3 left-3 h-7 w-7 text-white/60 hover:text-white hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      if (confirm("Delete this offer?")) {
                        deleteOffer(offer.id);
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="font-semibold text-[15px]">
                      {offer.products?.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-lg font-bold text-primary">
                        EUR {discountedPrice.toFixed(2)}
                      </span>
                      <span className="text-sm text-muted-foreground line-through">
                        EUR {originalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(offer.start_date).toLocaleDateString()} -{" "}
                      {new Date(offer.end_date).toLocaleDateString()}
                    </span>
                    {isActive && daysLeft > 0 && (
                      <Badge
                        variant="outline"
                        className="text-[10px] font-medium"
                      >
                        {daysLeft}d left
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
