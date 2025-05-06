// src/components/Cronograma.jsx
import React, { useEffect, useState } from 'react'
import api from '../api'               // tu instancia de axios que apunta a http://localhost:3001
import { FiChevronRight } from 'react-icons/fi'
import './Cronograma.css'

export default function Cronograma() {
  const [sections, setSections] = useState([])

  useEffect(() => {
    api.get('/agenda')        // -> GET http://localhost:3001/api/agenda
      .then(res => {
        const eventos = Array.isArray(res.data) ? res.data : []
        // agrupamos por fecha
        const grouped = {}
        eventos.forEach(evt => {
          // evt.start.dateTime ó evt.start.date (si es all-day)
          const start = new Date(evt.start.dateTime || evt.start.date)
          const dateKey = start.toLocaleDateString('es-AR', {
            day: '2-digit', month: 'long', year: 'numeric'
          })
          const timeLabel = start.toLocaleTimeString('es-AR', {
            hour: '2-digit', minute: '2-digit'
          })

          if (!grouped[dateKey]) grouped[dateKey] = []
          grouped[dateKey].push({
            time: timeLabel,
            title: evt.summary,
            desc: evt.description
          })
        })

        // convertimos a [{ date, items: [...] }, …]
        const secs = Object.entries(grouped).map(([date, items]) => ({ date, items }))
        setSections(secs)
      })
      .catch(err => {
        console.error('Error cargando agenda:', err)
        setSections([])
      })
  }, [])

  return (
    <div className="cronograma-card">
      <div className="cronograma-header">
        <h3>
          Cronograma 
        </h3>
        <button className="view-more">
          Ver Más <FiChevronRight />
        </button>
      </div>

      {sections.map(section => (
        <div key={section.date} className="cronograma-section">
          <div className="section-date">{section.date}</div>
          {section.items.map((e, i) => (
            <div key={i} className="event-item">
              <div className="event-time">{e.time}</div>
              <div className="event-bar" />
              <div className="event-content">
                <div className="event-title">{e.title}</div>
                {e.desc && <div className="event-desc">{e.desc}</div>}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
