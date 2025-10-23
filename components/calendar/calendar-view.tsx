
"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Video } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { exportToCSV, flattenObject } from "@/lib/export-utils";

// Dynamically import FullCalendar to avoid SSR issues
const FullCalendarComponent = dynamic(() => import('./full-calendar-wrapper'), {
  ssr: false,
  loading: () => <CalendarSkeleton />
});

interface CalendarViewProps {
  userRole: string;
}

interface AppointmentEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    clientName: string;
    personnelName: string;
    serviceName: string;
    status: string;
    price: number;
    notes?: string;
    isOnline?: boolean;
    meetLink?: string;
  };
}

function CalendarSkeleton() {
  return (
    <Card className="p-6">
      <div className="animate-pulse">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {[...Array(35)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    </Card>
  );
}

const statusColors: Record<string, { bg: string; border: string }> = {
  SCHEDULED: { bg: '#3B82F6', border: '#1E40AF' },
  COMPLETED: { bg: '#10B981', border: '#047857' },
  CANCELLED: { bg: '#EF4444', border: '#DC2626' },
  NO_SHOW: { bg: '#F59E0B', border: '#D97706' },
  IN_PROGRESS: { bg: '#8B5CF6', border: '#7C3AED' }
};

export function CalendarView({ userRole }: CalendarViewProps) {
  const [appointments, setAppointments] = useState<AppointmentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<AppointmentEvent | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/appointments');
      if (response.ok) {
        const data = await response.json();
        const events = data.map((appointment: any) => {
          const status = appointment.status || 'SCHEDULED';
          const colors = statusColors[status] || statusColors.SCHEDULED;
          
          return {
            id: appointment.id,
            title: `${appointment.client?.firstName} ${appointment.client?.lastName}`,
            start: appointment.appointmentDate,
            end: new Date(
              new Date(appointment.appointmentDate).getTime() + 
              (appointment.duration * 60 * 1000)
            ).toISOString(),
            backgroundColor: colors.bg,
            borderColor: colors.border,
            extendedProps: {
              clientName: `${appointment.client?.firstName} ${appointment.client?.lastName}`,
              personnelName: `${appointment.personnel?.firstName} ${appointment.personnel?.lastName}`,
              serviceName: appointment.service?.name,
              status: appointment.status,
              price: appointment.price,
              notes: appointment.notes,
              isOnline: appointment.isOnline,
              meetLink: appointment.meetLink
            }
          };
        });
        setAppointments(events);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (info: any) => {
    setSelectedEvent({
      id: info.event.id,
      title: info.event.title,
      start: info.event.start.toISOString(),
      end: info.event.end?.toISOString() || info.event.start.toISOString(),
      backgroundColor: info.event.backgroundColor,
      borderColor: info.event.borderColor,
      extendedProps: info.event.extendedProps
    });
  };

  const handleExport = () => {
    const exportData = appointments.map(apt => ({
      Danisan: apt.extendedProps.clientName,
      Psikolog: apt.extendedProps.personnelName,
      Hizmet: apt.extendedProps.serviceName,
      Tarih: format(new Date(apt.start), "dd/MM/yyyy", { locale: tr }),
      Saat: format(new Date(apt.start), "HH:mm", { locale: tr }),
      Durum: apt.extendedProps.status,
      Ucret: apt.extendedProps.price,
      Notlar: apt.extendedProps.notes || ""
    }));
    
    exportToCSV(exportData, "randevular");
  };

  if (loading) {
    return <CalendarSkeleton />;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Randevu Takvimi</h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExport}
            disabled={appointments.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Dışa Aktar
          </Button>
        </div>
        
        <Card className="p-6">
          <FullCalendarComponent
            events={appointments}
            onEventClick={handleEventClick}
            userRole={userRole}
          />
        </Card>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Randevu Detayları
              </h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Danışan</label>
                <p className="text-gray-900">{selectedEvent.extendedProps.clientName}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Psikolog</label>
                <p className="text-gray-900">{selectedEvent.extendedProps.personnelName}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Hizmet</label>
                <p className="text-gray-900">{selectedEvent.extendedProps.serviceName}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Tarih & Saat</label>
                <p className="text-gray-900">
                  {format(new Date(selectedEvent.start), "d MMMM yyyy, EEEE", { locale: tr })}
                  <br />
                  {format(new Date(selectedEvent.start), "HH:mm", { locale: tr })} - 
                  {format(new Date(selectedEvent.end), "HH:mm", { locale: tr })}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Durum</label>
                <div className="mt-1">
                  <Badge
                    style={{
                      backgroundColor: selectedEvent.backgroundColor,
                      color: 'white'
                    }}
                  >
                    {selectedEvent.extendedProps.status}
                  </Badge>
                </div>
              </div>

              {selectedEvent.extendedProps.price && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Ücret</label>
                  <p className="text-gray-900">
                    {selectedEvent.extendedProps.price.toLocaleString('tr-TR')}₺
                  </p>
                </div>
              )}

              {selectedEvent.extendedProps.isOnline && selectedEvent.extendedProps.meetLink && (
                <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
                  <label className="text-sm font-semibold text-teal-700 flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Google Meet Linki
                  </label>
                  <div className="mt-2 flex items-center gap-2">
                    <a
                      href={selectedEvent.extendedProps.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-teal-600 hover:text-teal-700 underline break-all flex-1"
                    >
                      {selectedEvent.extendedProps.meetLink}
                    </a>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (selectedEvent.extendedProps.meetLink) {
                          navigator.clipboard.writeText(selectedEvent.extendedProps.meetLink);
                          alert('Link kopyalandı!');
                        }
                      }}
                      title="Linki kopyala"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </Button>
                  </div>
                </div>
              )}

              {selectedEvent.extendedProps.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Notlar</label>
                  <p className="text-gray-900">{selectedEvent.extendedProps.notes}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
