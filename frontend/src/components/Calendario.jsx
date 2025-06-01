// src/pages/Calendario.jsx
import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import API from "../api";
import "./Calendario.css";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function Calendario() {
  const [events, setEvents] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    API.get("/agenda")
      .then((res) => setEvents(Array.isArray(res.data) ? res.data : []))
      .catch((err) => {
        console.error("Error cargando agenda:", err);
        setEvents([]);
      });
  }, []);

  const handleDateClick = (arg) => {
    setSelectedEvent(arg);
    setOpen(true);
  };

  return (
    <div className="cal-container">
      <FullCalendar
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        locale={esLocale}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "timeGridWeek,timeGridDay",
        }}
        events={events}
        dateClick={handleDateClick}
        height="auto"
        scrollTime="00:00"
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {/* Este botón nunca aparece, sólo dispara el dialog internamente */}
          <Button className="hidden">Abrir</Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedEvent?.event?.title || selectedEvent?.dateStr}
            </DialogTitle>
          </DialogHeader>
          <div>
            <p>
              <strong>Hora:</strong>{" "}
              {selectedEvent?.date &&
                new Date(selectedEvent.date).toLocaleTimeString()}
            </p>
          </div>
          <div className="mt-4 text-right">
            <Button onClick={() => setOpen(false)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
