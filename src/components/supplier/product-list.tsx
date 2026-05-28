"use client";

import { useState } from "react";
import {
  toggleProductAvailability,
  deleteProduct,
} from "@/lib/actions/products";
import { ProductForm } from "./product-form";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Eye, EyeOff, Plus } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  unit: string;
  price: number;
  min_order_qty: number | null;
  is_available: boolean | null;
  categories: { name: string } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export function ProductList({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  return (
    <>
      <div className="flex justify-end">
        <Dialog>
          <DialogTrigger className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium h-8 gap-1.5 px-2.5 cursor-pointer hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <ProductForm categories={categories} />
          </DialogContent>
        </Dialog>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No products yet. Add your first product to get started.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Min Qty</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.categories?.name ?? "-"}</TableCell>
                <TableCell>{product.unit}</TableCell>
                <TableCell className="text-right">
                  EUR {product.price.toFixed(2)}
                </TableCell>
                <TableCell>{product.min_order_qty}</TableCell>
                <TableCell>
                  <Badge
                    variant={product.is_available ? "default" : "secondary"}
                  >
                    {product.is_available ? "Available" : "Unavailable"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        toggleProductAvailability(
                          product.id,
                          !product.is_available,
                        )
                      }
                      title={
                        product.is_available
                          ? "Mark unavailable"
                          : "Mark available"
                      }
                    >
                      {product.is_available ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditProduct(product)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Delete this product?")) {
                          deleteProduct(product.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!editProduct} onOpenChange={() => setEditProduct(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {editProduct && (
            <ProductForm product={editProduct} categories={categories} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
