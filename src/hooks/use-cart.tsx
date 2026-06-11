"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { applyDiscount, bestDiscounts, todayStr } from "@/lib/pricing";

export interface CartItem {
  productId: string;
  productName: string;
  unit: string;
  /** Effective price (after any active offer) - what checkout will charge. */
  unitPrice: number;
  /** List price when an offer is applied; undefined = no promo. */
  originalUnitPrice?: number;
  discountPct?: number;
  quantity: number;
  supplierId: string;
  supplierName: string;
  minQty: number;
  currency: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  addItems: (items: CartItem[]) => void;
  clearCart: () => void;
  clearSupplierItems: (supplierId: string) => void;
  getItemQuantity: (productId: string) => number;
  getSupplierItems: (supplierId: string) => CartItem[];
  getSupplierIds: () => string[];
  totalItems: number;
}

const CartContext = createContext<CartContextType | null>(null);

// Cart persists across refreshes and sessions. A restaurant order takes real
// time to assemble - losing it to an accidental refresh is the single worst
// thing this UI can do. Scoped per user id so a shared machine never leaks a
// cart between accounts.
const STORAGE_KEY = "procurelink.cart.v1";

interface StoredCart {
  userId: string;
  items: CartItem[];
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  // Persisting before the restore pass finished would overwrite the saved
  // cart with the initial empty state.
  const [hydrated, setHydrated] = useState(false);
  const userIdRef = useRef<string | null>(null);

  // Restore once per mount, then revalidate against the live catalog so the
  // cart never shows deleted/unavailable products or stale prices.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const userId = session?.user?.id ?? null;
        userIdRef.current = userId;
        if (!userId) return;

        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const stored = JSON.parse(raw) as StoredCart;
        if (stored.userId !== userId || !stored.items?.length) return;

        const ids = stored.items.map((i) => i.productId);
        const [{ data: products }, { data: activeOffers }] = await Promise.all([
          supabase
            .from("products")
            .select("id, price, is_available, min_order_qty")
            .in("id", ids),
          supabase
            .from("offers")
            .select("product_id, discount_pct")
            .in("product_id", ids)
            .eq("is_active", true)
            .lte("start_date", todayStr())
            .gte("end_date", todayStr()),
        ]);
        const byId = new Map((products ?? []).map((p) => [p.id, p]));
        const discounts = bestDiscounts(activeOffers ?? []);
        const valid = stored.items
          .filter((i) => byId.get(i.productId)?.is_available)
          .map((i) => {
            const p = byId.get(i.productId)!;
            const pct = discounts.get(i.productId) ?? 0;
            const listPrice = Number(p.price);
            return {
              ...i,
              unitPrice: applyDiscount(listPrice, pct),
              originalUnitPrice: pct > 0 ? listPrice : undefined,
              discountPct: pct > 0 ? pct : undefined,
              minQty: p.min_order_qty ?? 1,
            };
          });
        if (!cancelled && valid.length > 0) setItems(valid);
      } catch {
        // Corrupted storage or auth hiccup - start with an empty cart.
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist on every change (after hydration).
  useEffect(() => {
    if (!hydrated || !userIdRef.current) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ userId: userIdRef.current, items } satisfies StoredCart)
      );
    } catch {
      // Storage full/unavailable - the in-memory cart still works.
    }
  }, [items, hydrated]);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === item.productId);
        if (existing) {
          return prev.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + 1 }
              : i
          );
        }
        return [...prev, { ...item, quantity: item.minQty }];
      });
    },
    []
  );

  /** Bulk insert (used by reorder). Quantities of existing items are summed. */
  const addItems = useCallback((newItems: CartItem[]) => {
    setItems((prev) => {
      const next = [...prev];
      for (const item of newItems) {
        const idx = next.findIndex((i) => i.productId === item.productId);
        if (idx >= 0) {
          next[idx] = { ...next[idx], quantity: next[idx].quantity + item.quantity };
        } else {
          next.push(item);
        }
      }
      return next;
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        setItems((prev) => prev.filter((i) => i.productId !== productId));
        return;
      }
      setItems((prev) =>
        prev.map((i) =>
          i.productId === productId ? { ...i, quantity } : i
        )
      );
    },
    []
  );

  const clearCart = useCallback(() => setItems([]), []);

  const clearSupplierItems = useCallback((supplierId: string) => {
    setItems((prev) => prev.filter((i) => i.supplierId !== supplierId));
  }, []);

  const getItemQuantity = useCallback(
    (productId: string) =>
      items.find((i) => i.productId === productId)?.quantity ?? 0,
    [items]
  );

  const getSupplierItems = useCallback(
    (supplierId: string) =>
      items.filter((i) => i.supplierId === supplierId),
    [items]
  );

  const getSupplierIds = useCallback(() => {
    return [...new Set(items.map((i) => i.supplierId))];
  }, [items]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        addItems,
        removeItem,
        updateQuantity,
        clearCart,
        clearSupplierItems,
        getItemQuantity,
        getSupplierItems,
        getSupplierIds,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
