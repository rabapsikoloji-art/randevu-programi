
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, User, MapPin } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface Appointment {
  id: string;
  appointmentDate: string;
  duration: number;
  status: string;
  price: number | null;
  notes?: string;
  personnel: {
    firstName: string;
    lastName: string;
    photo?: string;
  };
  service: {
    name: string;
  };
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

export function ClientAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await fetch("/api/client/appointments");
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
      <div className="grid gap-6 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const upcomingAppointments = appointments?.filter(apt => 
    new Date(apt.appointmentDate) >= new Date() && apt.status === "SCHEDULED"
  ) || [];

  const pastAppointments = appointments?.filter(apt => 
    new Date(apt.appointmentDate) < new Date() || apt.status !== "SCHEDULED"
  ) || [];

  return (
    <div className="space-y-8">
      {/* Upcoming Appointments */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Yaklaşan Randevular
        </h2>
        {upcomingAppointments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">Yaklaşan randevu bulunmuyor</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingAppointments.map((appointment) => (
              <Card key={appointment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-gray-900">
                      {appointment.service?.name}
                    </CardTitle>
                    <Badge className={statusColors[appointment.status]}>
                      {statusLabels[appointment.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={appointment.personnel?.photo || ""} />
                      <AvatarFallback className="bg-teal-100 text-teal-700">
                        {appointment.personnel?.firstName?.charAt(0)}
                        {appointment.personnel?.lastName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">
                        {appointment.personnel?.firstName} {appointment.personnel?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">Psikolog</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>
                        {format(new Date(appointment.appointmentDate), "d MMM yyyy", { locale: tr })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>
                        {format(new Date(appointment.appointmentDate), "HH:mm", { locale: tr })}
                      </span>
                    </div>
                  </div>

                  {appointment.price && (
                    <div className="text-lg font-semibold text-teal-600">
                      {appointment.price.toLocaleString('tr-TR')}₺
                    </div>
                  )}

                  {appointment.notes && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {appointment.notes}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Past Appointments */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Geçmiş Randevular
        </h2>
        {pastAppointments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">Geçmiş randevu bulunmuyor</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pastAppointments.map((appointment) => (
              <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900 truncate">
                      {appointment.service?.name}
                    </h3>
                    <Badge className={`${statusColors[appointment.status]} text-xs`}>
                      {statusLabels[appointment.status]}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      <span className="truncate">
                        {appointment.personnel?.firstName} {appointment.personnel?.lastName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(new Date(appointment.appointmentDate), "d MMM yyyy", { locale: tr })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span>
                        {format(new Date(appointment.appointmentDate), "HH:mm", { locale: tr })}
                      </span>
                    </div>
                  </div>

                  {appointment.price && (
                    <div className="text-sm font-medium text-teal-600 mt-3">
                      {appointment.price.toLocaleString('tr-TR')}₺
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
