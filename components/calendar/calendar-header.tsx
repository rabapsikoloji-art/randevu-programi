
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Plus, Filter, Download } from "lucide-react";
import { AppointmentDialog } from "./appointment-dialog";

interface CalendarHeaderProps {
  userRole: string;
}

export function CalendarHeader({ userRole }: CalendarHeaderProps) {
  const [showNewAppointment, setShowNewAppointment] = useState(false);

  const canCreateAppointment = ["ADMINISTRATOR", "COORDINATOR", "PSYCHOLOGIST"].includes(userRole);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-teal-600" />
            <h1 className="text-2xl font-bold text-gray-900">Takvim</h1>
          </div>
          <p className="text-gray-600 mt-1">
            Randevu yönetimi ve takvim görünümü
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => alert("Filtreleme özelliği yakında geliyor")}>
            <Filter className="h-4 w-4 mr-2" />
            Filtrele
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => alert("Dışa aktarma özelliği yakında geliyor")}>
            <Download className="h-4 w-4 mr-2" />
            Dışa Aktar
          </Button>

          {canCreateAppointment && (
            <Button 
              onClick={() => setShowNewAppointment(true)}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Yeni Randevu
            </Button>
          )}
        </div>
      </div>

      {showNewAppointment && (
        <AppointmentDialog
          open={showNewAppointment}
          onClose={() => setShowNewAppointment(false)}
          userRole={userRole}
        />
      )}
    </>
  );
}
