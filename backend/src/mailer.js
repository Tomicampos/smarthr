// backend/src/mailer.js
require('dotenv').config();
const nodemailer = require('nodemailer');
const path       = require('path');

async function getHbs() {
  // cargamos dinámicamente el módulo ESM
  const { default: hbs } = await import('nodemailer-express-handlebars');
  return hbs;
}

let _transporter;
async function createTransporter() {
  const hbs = await getHbs();
  const transporter = nodemailer.createTransport({
    host:     process.env.SMTP_HOST,
    port:     Number(process.env.SMTP_PORT),
    secure:   false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  transporter.use('compile', hbs({
    viewEngine: {
      partialsDir: path.resolve(__dirname, 'email/plantillas'),
      defaultLayout: false
    },
    viewPath: path.resolve(__dirname, 'email/plantillas'),
    extName: '.hbs'
  }));

  // Verificamos conexión
  transporter.verify()
    .then(() => console.log('✅ SMTP listo para enviar correo'))
    .catch(err => console.error('❌ Error conectando al SMTP:', err));

  return transporter;
}

async function getTransporter() {
  if (!_transporter) {
    _transporter = await createTransporter();
  }
  return _transporter;
}

/**
 * Envía una notificación por email usando Handlebars
 */
async function enviarNotificacion({ to, asunto, nombre, cuerpoHtml }) {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from:    `"SmartHR" <${process.env.SMTP_FROM}>`,
    to,
    subject: asunto,
    template: 'notificacion',
    context: {
      nombre,
      cuerpo: cuerpoHtml,
      anio: new Date().getFullYear()
    },
    attachments: [{
      filename: 'logo.png',
      path:     path.resolve(__dirname, 'email/plantillas/assets/logo.png'),
      cid:      'logo_empresa'
    }]
  });
  console.log(`✉️ Enviado a ${to}: ${info.messageId}`);
}

module.exports = { enviarNotificacion };
