
"use client";

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import trLocale from '@fullcalendar/core/locales/tr';

interface FullCalendarWrapperProps {
  events: any[];
  onEventClick: (info: any) => void;
  userRole: string;
}

export default function FullCalendarWrapper({ events, onEventClick, userRole }: FullCalendarWrapperProps) {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      locale={trLocale}
      events={events}
      eventClick={onEventClick}
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      }}
      height="auto"
      aspectRatio={1.8}
      eventDisplay="block"
      dayMaxEvents={3}
      moreLinkClick="popover"
      businessHours={{
        daysOfWeek: [1, 2, 3, 4, 5, 6],
        startTime: '08:00',
        endTime: '18:00',
      }}
      slotMinTime="08:00:00"
      slotMaxTime="20:00:00"
      expandRows={true}
      eventMouseEnter={(info) => {
        info.el.style.cursor = 'pointer';
      }}
      eventDidMount={(info) => {
        info.el.style.border = `2px solid ${info.event.borderColor}`;
        info.el.style.borderRadius = '6px';
        info.el.style.fontSize = '12px';
        info.el.style.fontWeight = '500';
      }}
      dayCellDidMount={(info) => {
        const today = new Date();
        const cellDate = new Date(info.date);
        
        if (cellDate.toDateString() === today.toDateString()) {
          info.el.style.backgroundColor = '#fef3f2';
          info.el.style.borderColor = '#f87171';
        }
      }}
    />
  );
}
