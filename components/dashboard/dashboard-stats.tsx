
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, CreditCard, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface StatsData {
  totalAppointments: number;
  todayAppointments: number;
  totalClients: number;
  monthlyRevenue: number;
  pendingAppointments: number;
}

interface DashboardStatsProps {
  userRole: string;
}

export function DashboardStats({ userRole }: DashboardStatsProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/dashboard/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statsCards = [
    {
      title: "Bugünkü Randevular",
      value: stats?.todayAppointments || 0,
      icon: Calendar,
      color: "text-teal-600",
      bgColor: "bg-teal-100",
      roles: ["ADMINISTRATOR", "COORDINATOR", "PSYCHOLOGIST"]
    },
    {
      title: "Toplam Danışan",
      value: stats?.totalClients || 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      roles: ["ADMINISTRATOR", "COORDINATOR"]
    },
    {
      title: "Aylık Gelir",
      value: `${stats?.monthlyRevenue?.toLocaleString('tr-TR') || 0}₺`,
      icon: CreditCard,
      color: "text-green-600",
      bgColor: "bg-green-100",
      roles: ["ADMINISTRATOR"]
    },
    {
      title: "Bekleyen Randevular",
      value: stats?.pendingAppointments || 0,
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      roles: ["ADMINISTRATOR", "COORDINATOR", "PSYCHOLOGIST"]
    }
  ];

  const filteredStats = statsCards.filter(card => 
    card.roles.includes(userRole)
  );

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {filteredStats.map((card, index) => {
        const Icon = card.icon;
        const isNumber = typeof card.value === 'number';
        
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {isNumber ? (
                    <CountUpNumber value={card.value as number} />
                  ) : (
                    card.value
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

function CountUpNumber({ value }: { value: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (value === 0) return;
    
    const duration = 1000;
    const steps = 30;
    const stepValue = value / steps;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      setCount(Math.floor(stepValue * currentStep));
      
      if (currentStep >= steps) {
        setCount(value);
        clearInterval(timer);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{count}</span>;
}
