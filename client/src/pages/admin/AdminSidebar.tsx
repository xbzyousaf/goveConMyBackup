import { Link } from "wouter";
import {
  LayoutDashboard,
  Users,
  GitMerge,
  DollarSign,
  AlertTriangle,
  BarChart,
} from "lucide-react";

const nav = [
  { label: "Dashboard", href: "/admin-dashboard", icon: LayoutDashboard },
  { label: "Vendors", href: "/admin/vendors", icon: Users },
  { label: "Matches", href: "/admin/matches", icon: GitMerge },
  { label: "Escrow", href: "/admin/escrow", icon: DollarSign },
  { label: "Disputes", href: "/admin/disputes", icon: AlertTriangle },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart },
];

export function AdminSidebar() {
  return (
    <aside className="w-64 bg-background border-r">
      <div className="p-6 font-bold text-lg">GovScale Admin</div>

      <nav className="space-y-1 px-3">
        {nav.map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href}>
            <a className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-sm">
              <Icon className="w-4 h-4" />
              {label}
            </a>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
