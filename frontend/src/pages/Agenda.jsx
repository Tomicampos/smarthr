// src/pages/Agenda.jsx
import React from "react";
import Calendario from "../components/Calendario";

export default function Agenda() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-semibold mb-4">Mi Agenda</h1>
      <Calendario />
    </div>
  );
}
