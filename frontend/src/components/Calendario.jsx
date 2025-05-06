// src/components/Calendario.jsx
import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import "./Calendario.css";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";

export default function Calendario() {
  const [events, setEvents] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3001/api/agenda")  // <— asegúrate de que coincida con tu ruta real
      .then((res) => res.json())
      .then((data) => {
        // DEBUG: destripa la respuesta en consola
        console.log("RAW EVENTS:", data);
        setEvents(
          data.map((e) => ({
            title: e.summary || "(Sin título)",
            // si es evento de todo el día:
            start: e.start.dateTime || e.start.date,
            end:   e.end.dateTime   || e.end.date,
            allDay: !!e.start.date && !e.start.dateTime,
          }))
        );
      })
      .catch((err) => console.error("Error cargando agenda:", err));
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
          <Button style={{ display: "none" }}>Abrir</Button>
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
