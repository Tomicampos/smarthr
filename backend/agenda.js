// backend/agenda.js
const { google } = require('googleapis');
const express = require('express');
const router = express.Router();

const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json',       // Asegúrate de tener este JSON aquí
  scopes: ['https://www.googleapis.com/auth/calendar.readonly']
});
const calendar = google.calendar({ version: 'v3', auth });

router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const oneWeek = new Date(now.getTime() + 7*24*60*60*1000);
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: oneWeek.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 50
    });

    const items = response.data.items.map(evt => ({
      start: evt.start.dateTime || evt.start.date,
      summary: evt.summary,
      description: evt.description || ''
    }));
    res.json(items);
  } catch (err) {
    console.error('Error Google Calendar', err);
    res.status(500).json({ message: 'No se pudieron cargar los eventos' });
  }
});

module.exports = router;
