-- Crear base de datos
CREATE DATABASE IF NOT EXISTS SistemaVoluntariado;

USE SistemaVoluntariado;

-- Tabla Usuario
CREATE TABLE IF NOT EXISTS usuario (
    idUsuario INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    apPaterno VARCHAR(100) NOT NULL,
    apMaterno VARCHAR(100) NOT NULL,
    dni INT NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    codUniversitario VARCHAR(20),
    tipoCodUniversitario VARCHAR(50),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);