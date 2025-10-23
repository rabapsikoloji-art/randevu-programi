
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface Appointment {
  id: string;
  appointmentDate: string;
  duration: number;
  status: string;
  price: number | null;
  client: {
    firstName: string;
    lastName: string;
    photo: string | null;
  };
  personnel: {
    firstName: string;
    lastName: string;
  };
  service: {
    name: string;
  };
}

interface RecentAppointmentsProps {
  userRole: string;
}

const statusLabels: Record<string, string> = {
  SCHEDULED: "Planlandı",
  COMPLETED: "Tamamlandı",
  CANCELLED: "İptal Edildi",
  NO_SHOW: "Gelmedi",
  IN_PROGRESS: "Devam Ediyor"
};

const statusColors: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  NO_SHOW: "bg-orange-100 text-orange-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700"
};

export function RecentAppointments({ userRole }: RecentAppointmentsProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await fetch("/api/appointments/recent");
        if (response.ok) {
          const data = await response.json();
          setAppointments(data);
        }
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-teal-600" />
            Son Randevular
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-teal-600" />
          Son Randevular
        </CardTitle>
      </CardHeader>
      <CardContent>
        {appointments?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Henüz randevu bulunmuyor</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments?.slice(0, 5).map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={appointment?.client?.photo || ""} />
                  <AvatarFallback className="bg-teal-100 text-teal-700">
                    {appointment?.client?.firstName?.charAt(0) || ""}
                    {appointment?.client?.lastName?.charAt(0) || ""}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {appointment?.client?.firstName} {appointment?.client?.lastName}
                    </p>
                    <Badge
                      className={`${statusColors[appointment?.status || ""] || "bg-gray-100 text-gray-700"} text-xs`}
                    >
                      {statusLabels[appointment?.status || ""] || appointment?.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {appointment?.appointmentDate ? 
                        format(new Date(appointment.appointmentDate), "d MMM, HH:mm", { locale: tr }) 
                        : "Tarih belirtilmemiş"
                      }
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {appointment?.personnel?.firstName} {appointment?.personnel?.lastName}
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-400 mt-1">
                    {appointment?.service?.name}
                    {appointment?.price && ` - ${appointment.price.toLocaleString('tr-TR')}₺`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
