import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { CartProvider } from "@/hooks/use-cart";
import { ThemeProvider } from "@/hooks/use-theme";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ProcureLink - Restaurant Supply Management",
  description:
    "Connect restaurants with suppliers. Browse products, place orders, and schedule deliveries.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <CartProvider>{children}</CartProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
