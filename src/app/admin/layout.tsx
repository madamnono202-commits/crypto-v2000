import { requireAdmin } from "@/lib/admin";
import { AdminSidebar, AdminMobileNav } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminMobileNav />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
