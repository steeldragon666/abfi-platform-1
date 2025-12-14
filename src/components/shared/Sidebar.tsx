"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Leaf,
  LayoutDashboard,
  Package,
  FileText,
  MessageSquare,
  Settings,
  Search,
  Star,
  Users,
  CheckCircle,
  BarChart3,
  LogOut,
  TrendingUp,
  Database,
  Bell,
  ClipboardList,
  Megaphone,
  Factory,
  LineChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

const supplierNavItems: NavItem[] = [
  { title: "Dashboard", href: "/supplier", icon: LayoutDashboard },
  { title: "My Feedstocks", href: "/supplier/feedstocks", icon: Package },
  { title: "Markets", href: "/supplier/markets", icon: LineChart },
  { title: "CI Reports", href: "/supplier/ci-reports", icon: Leaf },
  { title: "Documents", href: "/supplier/documents", icon: FileText },
  { title: "Inquiries", href: "/supplier/inquiries", icon: MessageSquare },
  { title: "Notifications", href: "/supplier/notifications", icon: Bell },
  { title: "Settings", href: "/supplier/settings", icon: Settings },
];

const buyerNavItems: NavItem[] = [
  { title: "Dashboard", href: "/buyer", icon: LayoutDashboard },
  { title: "Search Feedstocks", href: "/buyer/search", icon: Search },
  { title: "Markets", href: "/buyer/markets", icon: LineChart },
  { title: "Shortlist", href: "/buyer/shortlist", icon: Star },
  { title: "Bankability", href: "/buyer/bankability", icon: TrendingUp },
  { title: "My Inquiries", href: "/buyer/inquiries", icon: MessageSquare },
  { title: "Facilities", href: "/buyer/facilities", icon: Factory },
  { title: "Notifications", href: "/buyer/notifications", icon: Bell },
  { title: "Settings", href: "/buyer/settings", icon: Settings },
];

const adminNavItems: NavItem[] = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Verification Queue", href: "/admin/verification", icon: CheckCircle },
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "ABBA Import", href: "/admin/abba-import", icon: Database },
  { title: "Announcements", href: "/admin/announcements", icon: Megaphone },
  { title: "Audit Logs", href: "/admin/audit-logs", icon: ClipboardList },
  { title: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { title: "Settings", href: "/admin/settings", icon: Settings },
];

const auditorNavItems: NavItem[] = [
  { title: "Dashboard", href: "/auditor", icon: LayoutDashboard },
  { title: "CI Verification", href: "/auditor/ci-verification", icon: CheckCircle },
  { title: "Completed Audits", href: "/auditor/completed", icon: FileText },
  { title: "Analytics", href: "/auditor/analytics", icon: BarChart3 },
  { title: "Settings", href: "/auditor/settings", icon: Settings },
];

interface SidebarProps {
  role: "supplier" | "buyer" | "admin" | "auditor";
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const navItems =
    role === "supplier"
      ? supplierNavItems
      : role === "buyer"
        ? buyerNavItems
        : role === "auditor"
          ? auditorNavItems
          : adminNavItems;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex h-full w-64 flex-col border-r bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <div className="w-8 h-8 bg-[#1B4332] rounded-lg flex items-center justify-center">
          <Leaf className="w-5 h-5 text-[#D4A853]" />
        </div>
        <span className="text-xl font-bold text-[#1B4332]">ABFI</span>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== `/${role}` && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Sign out */}
      <div className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3"
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
