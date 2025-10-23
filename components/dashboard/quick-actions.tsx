
"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Calendar, 
  Users, 
  FileText, 
  CreditCard,
  Settings,
  Package
} from "lucide-react";

interface QuickActionsProps {
  userRole: string;
}

export function QuickActions({ userRole }: QuickActionsProps) {
  const actions = [
    {
      title: "Yeni Randevu",
      description: "Hızlı randevu oluştur",
      href: "/dashboard/calendar?action=new",
      icon: Calendar,
      color: "bg-teal-500 hover:bg-teal-600",
      roles: ["ADMINISTRATOR", "COORDINATOR", "PSYCHOLOGIST"]
    },
    {
      title: "Danışan Ekle",
      description: "Yeni danışan kaydı",
      href: "/dashboard/clients?action=new",
      icon: Users,
      color: "bg-blue-500 hover:bg-blue-600",
      roles: ["ADMINISTRATOR", "COORDINATOR"]
    },
    {
      title: "Ödeme Kaydet",
      description: "Hızlı ödeme kaydı",
      href: "/dashboard/cash-register?action=new",
      icon: CreditCard,
      color: "bg-green-500 hover:bg-green-600",
      roles: ["ADMINISTRATOR", "COORDINATOR"]
    },
    {
      title: "Hizmet Ekle",
      description: "Yeni hizmet tanımla",
      href: "/dashboard/services?action=new",
      icon: Settings,
      color: "bg-purple-500 hover:bg-purple-600",
      roles: ["ADMINISTRATOR"]
    },
    {
      title: "Paket Oluştur",
      description: "Yeni hizmet paketi",
      href: "/dashboard/packages?action=new",
      icon: Package,
      color: "bg-orange-500 hover:bg-orange-600",
      roles: ["ADMINISTRATOR"]
    },
    {
      title: "Rapor Görüntüle",
      description: "İstatistikler ve raporlar",
      href: "/dashboard/statistics",
      icon: FileText,
      color: "bg-indigo-500 hover:bg-indigo-600",
      roles: ["ADMINISTRATOR", "COORDINATOR"]
    }
  ];

  const filteredActions = actions.filter(action => 
    action.roles.includes(userRole)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-teal-600" />
          Hızlı İşlemler
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredActions.map((action) => {
            const Icon = action.icon;
            
            return (
              <Link key={action.title} href={action.href}>
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto p-4 hover:bg-gray-50"
                >
                  <div className={`p-2 rounded-lg ${action.color} mr-3`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">
                      {action.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {action.description}
                    </p>
                  </div>
                </Button>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
