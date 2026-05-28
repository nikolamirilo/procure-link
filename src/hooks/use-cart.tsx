"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export interface CartItem {
  productId: string;
  productName: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  supplierId: string;
  supplierName: string;
  minQty: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  clearSupplierItems: (supplierId: string) => void;
  getItemQuantity: (productId: string) => number;
  getSupplierItems: (supplierId: string) => CartItem[];
  getSupplierIds: () => string[];
  totalItems: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

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
