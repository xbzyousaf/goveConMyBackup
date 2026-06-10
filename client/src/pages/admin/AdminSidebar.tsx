import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  FileText,
  Receipt,
  Briefcase,
  Import,
  CheckCircle,
  DollarSign,
  MessageCircleQuestion
} from "lucide-react";


const nav = [
  { label: "Dashboard", href: "/admin-dashboard", icon: LayoutDashboard },
  { label: "Vendors", href: "/admin/vendors", icon: Users },
  { label: "Support Requests", href: "/support", icon: MessageCircleQuestion },
  // { label: "Transactions", href: "/admin/transactions", icon: Receipt },
  { label: "Disputes", href: "/admin/disputes", icon: AlertTriangle },
  { label: "Services", href: "/admin/services", icon: Briefcase },
  { label: "Growth Checklists", href: "/admin/guideness", icon: CheckCircle },
  { label: "Request Logs", href: "/admin/request-logs", icon: FileText },
  { label: "Vendor Imports", href: "/admin/vendor-imports", icon: Import },
  { label: "Categories", href: "/admin/categories", icon: LayoutDashboard },
  { label: "Platform Fees", href: "/admin/platform-fees", icon: DollarSign },

];

export function AdminSidebar() {
  return (
    <aside className="w-64 bg-background border-r">
      <div className="p-6 font-bold text-lg">PROOF Admin</div>

      <nav className="space-y-1 px-3">
        {nav.map(({ label, href, icon: Icon }) => (
            <a key={href} href={href} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-sm">
              <Icon className="w-4 h-4" />
              {label}
            </a>
        ))}
      </nav>
    </aside>
  );
}
