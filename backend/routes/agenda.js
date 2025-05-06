// server/routes/agenda.js  (ó donde tengas montado tu /agenda)
const express = require('express')
const router  = express.Router()
const { google } = require('googleapis')
require('dotenv').config()

// configura tu OAuth2Client con CLIENT_ID/SECRET/REDIRECT_URI + REFRESH_TOKEN
const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
)
oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN })

router.get('/', async (req, res) => {
  try {
    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client })
    const resp = await calendar.events.list({
      calendarId: process.env.CALENDAR_ID,
      timeMin: (new Date()).toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    })
    res.json(resp.data.items)      // <-- devuelve el array raw para el front
  } catch (err) {
    console.error('Agenda error:', err)
    res.status(500).json({ error: 'no pude leer los eventos' })
  }
})

module.exports = router
