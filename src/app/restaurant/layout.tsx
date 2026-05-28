import { RestaurantSidebar } from "@/components/restaurant/restaurant-sidebar";

export default function RestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row h-screen">
      <RestaurantSidebar />
      <main className="flex-1 overflow-auto bg-background">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
