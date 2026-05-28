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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/constants";
import {
  Ban,
  CreditCard,
  Loader2,
  CheckCircle2,
  Truck,
  Package,
} from "lucide-react";
import type { OrderStatus, PaymentStatus } from "@/lib/supabase/types";

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
  commission_amt: number;
  payment_status: string | null;
  delivery_date: string;
  placed_at: string | null;
  notes: string | null;
  order_items: OrderItem[];
  restaurant: { name: string } | null;
}

export function SupplierOrderList({ orders }: { orders: Order[] }) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No orders yet. Orders from restaurants will appear here.
      </div>
    );
  }

  async function handleStatusChange(orderId: string, status: string) {
    setLoadingAction(`status-${orderId}`);
    await updateOrderStatus(orderId, status as OrderStatus);
    setLoadingAction(null);
  }

  async function handleCancel(orderId: string) {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setLoadingAction(`cancel-${orderId}`);
    await updateOrderStatus(orderId, "cancelled", "Cancelled by supplier");
    setLoadingAction(null);
  }

  async function handleMarkPaid(orderId: string) {
    setLoadingAction(`pay-${orderId}`);
    await updatePaymentStatus(orderId, "paid");
    setLoadingAction(null);
  }

  async function handleConfirm(orderId: string) {
    setLoadingAction(`confirm-${orderId}`);
    await updateOrderStatus(orderId, "confirmed");
    setLoadingAction(null);
  }

  async function handleDispatch(orderId: string) {
    setLoadingAction(`dispatch-${orderId}`);
    await updateOrderStatus(orderId, "dispatched");
    setLoadingAction(null);
  }

  async function handleDeliver(orderId: string) {
    setLoadingAction(`deliver-${orderId}`);
    await updateOrderStatus(orderId, "delivered");
    setLoadingAction(null);
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order #</TableHead>
            <TableHead>Restaurant</TableHead>
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

            const isFinal = status === "cancelled" || status === "delivered";
            const canPay = payment !== "paid" && status !== "cancelled";

            return (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-xs">
                  {order.order_number}
                </TableCell>
                <TableCell className="text-sm">
                  {order.restaurant?.name ?? "-"}
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
                  <div className="flex items-center justify-end gap-1 flex-wrap">
                    {/* Status progression buttons */}
                    {status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1 px-2"
                        disabled={!!loadingAction}
                        onClick={() => handleConfirm(order.id)}
                      >
                        {loadingAction === `confirm-${order.id}` ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3" />
                        )}
                        Confirm
                      </Button>
                    )}
                    {(status === "confirmed" || status === "preparing") && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1 px-2"
                        disabled={!!loadingAction}
                        onClick={() => handleDispatch(order.id)}
                      >
                        {loadingAction === `dispatch-${order.id}` ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Truck className="h-3 w-3" />
                        )}
                        Dispatch
                      </Button>
                    )}
                    {status === "dispatched" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1 px-2"
                        disabled={!!loadingAction}
                        onClick={() => handleDeliver(order.id)}
                      >
                        {loadingAction === `deliver-${order.id}` ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Package className="h-3 w-3" />
                        )}
                        Delivered
                      </Button>
                    )}

                    {/* Pay */}
                    {canPay && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1 px-2"
                        disabled={!!loadingAction}
                        onClick={() => handleMarkPaid(order.id)}
                      >
                        {loadingAction === `pay-${order.id}` ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CreditCard className="h-3 w-3" />
                        )}
                        Paid
                      </Button>
                    )}

                    {/* Cancel */}
                    {!isFinal && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 px-2 text-destructive hover:text-destructive"
                        disabled={!!loadingAction}
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

                    {isFinal && !canPay && (
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
