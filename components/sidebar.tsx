
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Calendar,
  CreditCard,
  Settings,
  Package,
  Users,
  UserCheck,
  BarChart3,
  LogOut,
  Menu,
  X,
  Stethoscope,
  BookOpen,
  CalendarPlus,
  Wallet
} from "lucide-react";

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
}

const sidebarItems: SidebarItem[] = [
  {
    title: "Takvim",
    href: "/dashboard/calendar",
    icon: Calendar,
    roles: ["ADMINISTRATOR", "COORDINATOR", "PSYCHOLOGIST"]
  },
  {
    title: "Kasa",
    href: "/dashboard/cash-register",
    icon: CreditCard,
    roles: ["ADMINISTRATOR", "COORDINATOR"]
  },
  {
    title: "Hizmetler",
    href: "/dashboard/services",
    icon: Settings,
    roles: ["ADMINISTRATOR", "COORDINATOR"]
  },
  {
    title: "Paketler",
    href: "/dashboard/packages",
    icon: Package,
    roles: ["ADMINISTRATOR", "COORDINATOR"]
  },
  {
    title: "Personel",
    href: "/dashboard/personnel",
    icon: UserCheck,
    roles: ["ADMINISTRATOR"]
  },
  {
    title: "Danışanlar",
    href: "/dashboard/clients",
    icon: Users,
    roles: ["ADMINISTRATOR", "COORDINATOR", "PSYCHOLOGIST"]
  },
  {
    title: "Ödevler",
    href: "/dashboard/assignments",
    icon: BookOpen,
    roles: ["ADMINISTRATOR", "PSYCHOLOGIST"]
  },
  {
    title: "İstatistikler",
    href: "/dashboard/statistics",
    icon: BarChart3,
    roles: ["ADMINISTRATOR", "COORDINATOR"]
  }
];

const clientSidebarItems: SidebarItem[] = [
  {
    title: "Randevularım",
    href: "/client/appointments",
    icon: Calendar,
    roles: ["CLIENT"]
  },
  {
    title: "Randevu Al",
    href: "/client/book-appointment",
    icon: CalendarPlus,
    roles: ["CLIENT"]
  },
  {
    title: "Ödemelerim",
    href: "/client/payments",
    icon: Wallet,
    roles: ["CLIENT"]
  }
];

export function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const userRole = session?.user?.role as string;
  const isClient = userRole === "CLIENT";
  const menuItems = isClient ? clientSidebarItems : sidebarItems;

  const filteredItems = menuItems.filter(item => 
    item.roles.includes(userRole || "")
  );

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  const getUserDisplayName = () => {
    if (session?.user?.personnel) {
      return `${session.user.personnel.firstName} ${session.user.personnel.lastName}`;
    }
    if (session?.user?.client) {
      return `${session.user.client.firstName} ${session.user.client.lastName}`;
    }
    return session?.user?.name || session?.user?.email || "Kullanıcı";
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      ADMINISTRATOR: "Yönetici",
      COORDINATOR: "Koordinatör",
      PSYCHOLOGIST: "Psikolog",
      CLIENT: "Danışan"
    };
    return roleMap[role] || role;
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-white shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="p-2 bg-teal-100 rounded-lg">
            <Stethoscope className="h-6 w-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Klinik Sistemi
            </h1>
            <p className="text-sm text-gray-500">
              Yönetim Paneli
            </p>
          </div>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-4 py-6">
        <nav className="space-y-2">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 text-sm rounded-lg transition-all duration-200 hover:bg-gray-100 group",
                  isActive 
                    ? "bg-teal-50 text-teal-700 shadow-sm border border-teal-200" 
                    : "text-gray-700 hover:text-gray-900"
                )}
              >
                <Icon 
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isActive 
                      ? "text-teal-600" 
                      : "text-gray-500 group-hover:text-gray-700"
                  )} 
                />
                <span className="font-medium">
                  {item.title}
                </span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User Profile */}
      <div className="border-t border-gray-200 p-4 space-y-2">
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session?.user?.image || ""} />
            <AvatarFallback className="bg-teal-100 text-teal-700">
              {getUserDisplayName().charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-gray-900">
              {getUserDisplayName()}
            </p>
            <p className="text-xs text-gray-500">
              {getRoleDisplayName(userRole || "")}
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Çıkış Yap
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsMobileMenuOpen(true)}
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-25 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Sidebar */}
          <div className="fixed inset-y-0 left-0 z-50 w-64">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
}
