"use client";

import { useState } from "react";
import { updateOrderStatus, updatePaymentStatus } from "@/lib/actions/orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/constants";
import { Ban, CreditCard, Loader2, Repeat } from "lucide-react";

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string | null;
  currency: string;
  subtotal: number;
  total: number;
  payment_status: string | null;
  delivery_date: string;
  placed_at: string | null;
  notes: string | null;
  is_auto_placed: boolean;
  order_items: OrderItem[];
  supplier: { name: string } | null;
}

export function RestaurantOrderList({ orders }: { orders: Order[] }) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No orders yet. Browse products and place your first order.
      </div>
    );
  }

  async function handleCancel(orderId: string) {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setLoadingAction(`cancel-${orderId}`);
    await updateOrderStatus(orderId, "cancelled", "Cancelled by restaurant");
    setLoadingAction(null);
  }

  async function handleMarkPaid(orderId: string) {
    setLoadingAction(`pay-${orderId}`);
    await updatePaymentStatus(orderId, "paid");
    setLoadingAction(null);
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order #</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead className="hidden md:table-cell">Items</TableHead>
            <TableHead>Delivery</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const status = (order.status ??
              "pending") as keyof typeof ORDER_STATUSES;
            const payment = (order.payment_status ??
              "unpaid") as keyof typeof PAYMENT_STATUSES;
            const statusInfo = ORDER_STATUSES[status];
            const paymentInfo = PAYMENT_STATUSES[payment];

            const canCancel = status === "pending" || status === "confirmed";
            const canPay = payment !== "paid" && status !== "cancelled";

            return (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-xs">
                  <span className="flex items-center gap-1.5">
                    {order.order_number}
                    {order.is_auto_placed && (
                      <Badge className="bg-blue-100 text-blue-800 text-[9px] px-1.5 py-0 gap-0.5">
                        <Repeat className="h-2.5 w-2.5" />
                        Auto
                      </Badge>
                    )}
                  </span>
                </TableCell>
                <TableCell className="text-sm">
                  {order.supplier?.name ?? "-"}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="text-xs text-muted-foreground max-w-[200px]">
                    {order.order_items.slice(0, 2).map((item) => (
                      <div key={item.id} className="truncate">
                        {item.quantity}x {item.product_name}
                      </div>
                    ))}
                    {order.order_items.length > 2 && (
                      <span className="text-muted-foreground/60">
                        +{order.order_items.length - 2} more
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {new Date(order.delivery_date).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right text-sm font-medium tabular-nums">
                  {order.currency} {order.total.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Badge className={statusInfo.color + " text-xs"}>
                    {statusInfo.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={paymentInfo.color + " text-xs"}>
                    {paymentInfo.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {canPay && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1 px-2"
                        disabled={loadingAction === `pay-${order.id}`}
                        onClick={() => handleMarkPaid(order.id)}
                      >
                        {loadingAction === `pay-${order.id}` ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CreditCard className="h-3 w-3" />
                        )}
                        Pay
                      </Button>
                    )}
                    {canCancel && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 px-2 text-destructive hover:text-destructive"
                        disabled={loadingAction === `cancel-${order.id}`}
                        onClick={() => handleCancel(order.id)}
                      >
                        {loadingAction === `cancel-${order.id}` ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Ban className="h-3 w-3" />
                        )}
                        Cancel
                      </Button>
                    )}
                    {!canPay && !canCancel && (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
