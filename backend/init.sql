CREATE DATABASE IF NOT EXISTS smarthr_db;
USE smarthr_db;

-- Tabla de usuarios (ID manual porque suele ser DNI)
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  rol VARCHAR(50) NOT NULL DEFAULT 'empleado',
  linkedin VARCHAR(255),
  avatar LONGBLOB,
  avatar_mimetype VARCHAR(50)
);

-- Tabla para recuperación de contraseñas
CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  token VARCHAR(255),
  expires_at DATETIME
);

-- Recibos de sueldo
CREATE TABLE IF NOT EXISTS recibos_sueldo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subido_por INT,
  empleado_id INT,
  anio_periodo INT,
  mes_periodo INT,
  nombre_archivo VARCHAR(255),
  datos_pdf LONGBLOB,
  datos_pdf_original LONGBLOB
);

-- Documentos personales de empleados
CREATE TABLE IF NOT EXISTS empleado_documentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empleado_id INT,
  nombre_archivo VARCHAR(255),
  datos_blob LONGBLOB,
  fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  asunto VARCHAR(255),
  cuerpo TEXT,
  creado_por INT,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notificaciones_destinatarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  notificacion_id INT,
  empleado_id INT,
  estado VARCHAR(50) DEFAULT 'pendiente',
  enviado_en TIMESTAMP NULL
);

-- Reclutamiento y Selección
CREATE TABLE IF NOT EXISTS puestos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS areas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS reclutamiento (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(100),
  puesto_id INT,
  area_id INT,
  tipo_busqueda VARCHAR(100),
  estado VARCHAR(50),
  etapa_actual INT DEFAULT 1,
  fecha_inicio DATETIME,
  fecha_fin DATETIME,
  creado_por INT
);

CREATE TABLE IF NOT EXISTS postulantes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  proceso_id INT,
  nombre VARCHAR(255),
  email VARCHAR(255),
  telefono VARCHAR(100),
  notas TEXT,
  cv_blob LONGBLOB,
  cv_filename VARCHAR(255),
  linkedin VARCHAR(255),
  etapa_actual INT DEFAULT 1,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_final TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS eventos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  gcal_id VARCHAR(255),
  titulo VARCHAR(255),
  descripcion TEXT,
  fecha_inicio DATETIME,
  fecha_fin DATETIME,
  tipo VARCHAR(50),
  creado_por INT
);