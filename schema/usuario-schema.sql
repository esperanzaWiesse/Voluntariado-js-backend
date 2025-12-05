-- =============================================
-- SCRIPT DE INICIALIZACIÓN DE BASE DE DATOS
-- Sistema de Voluntariado - Con Delete Lógico
-- =============================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS SistemaVoluntariado;
USE SistemaVoluntariado;

-- Tabla Usuario con campos para delete lógico
CREATE TABLE usuario (
    idUsuario INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    apPaterno VARCHAR(100) NOT NULL,
    apMaterno VARCHAR(100) NOT NULL,
    dni INT NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    codUniversitario VARCHAR(20),
    tipoCodUniversitario VARCHAR(50),
    activo BOOLEAN DEFAULT TRUE COMMENT 'TRUE = activo, FALSE = eliminado lógicamente',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    fecha_eliminacion TIMESTAMP NULL COMMENT 'Fecha cuando se eliminó lógicamente'
);


-- Procedimiento almacenado CRUD para Usuario con delete lógico
CREATE PROCEDURE sp_Usuario_CRUD(
    IN p_Accion VARCHAR(10),
    IN p_idUsuario INT,
    IN p_nombre VARCHAR(100),
    IN p_apPaterno VARCHAR(100),
    IN p_apMaterno VARCHAR(100),
    IN p_dni INT,
    IN p_rol VARCHAR(100),
    IN p_email VARCHAR(150),
    IN p_password VARCHAR(255),
    IN p_codUniversitario VARCHAR(20),
    IN p_tipoCodUniversitario VARCHAR(50)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE, 
            @errno = MYSQL_ERRNO, 
            @text = MESSAGE_TEXT;
        SELECT @errno AS ErrorNumber, @text AS ErrorMessage;
        ROLLBACK;
    END;

    START TRANSACTION;

    IF p_Accion = 'INSERT' THEN
        INSERT INTO usuario (nombre, apPaterno, apMaterno, dni, rol, email, password, codUniversitario, tipoCodUniversitario, activo)
        VALUES (p_nombre, p_apPaterno, p_apMaterno, p_dni, p_rol, p_email, p_password, p_codUniversitario, p_tipoCodUniversitario, TRUE);
        
        SELECT LAST_INSERT_ID() AS idUsuario, 'Usuario insertado correctamente' AS Mensaje;

    ELSEIF p_Accion = 'UPDATE' THEN
        IF p_idUsuario IS NULL THEN
            SELECT 'Error: Se requiere idUsuario para actualizar' AS Mensaje;
        ELSE
            UPDATE usuario
            SET nombre = IFNULL(p_nombre, nombre),
                apPaterno = IFNULL(p_apPaterno, apPaterno),
                apMaterno = IFNULL(p_apMaterno, apMaterno),
                dni = IFNULL(p_dni, dni),
                rol = IFNULL(p_rol, rol),
                email = IFNULL(p_email, email),
                password = IFNULL(p_password, password),
                codUniversitario = IFNULL(p_codUniversitario, codUniversitario),
                tipoCodUniversitario = IFNULL(p_tipoCodUniversitario, tipoCodUniversitario)
            WHERE idUsuario = p_idUsuario AND activo = TRUE;
            
            IF ROW_COUNT() > 0 THEN
                SELECT p_idUsuario AS idUsuario, 'Usuario actualizado correctamente' AS Mensaje;
            ELSE
                SELECT 'Error: Usuario no encontrado o ya está eliminado' AS Mensaje;
            END IF;
        END IF;

    ELSEIF p_Accion = 'DELETE' THEN
        IF p_idUsuario IS NULL THEN
            SELECT 'Error: Se requiere idUsuario para eliminar' AS Mensaje;
        ELSE
            -- Delete lógico: marcar como inactivo y registrar fecha de eliminación
            UPDATE usuario 
            SET activo = FALSE,
                fecha_eliminacion = CURRENT_TIMESTAMP
            WHERE idUsuario = p_idUsuario AND activo = TRUE;
            
            IF ROW_COUNT() > 0 THEN
                SELECT p_idUsuario AS idUsuario, 'Usuario eliminado lógicamente' AS Mensaje;
            ELSE
                SELECT 'Error: Usuario no encontrado o ya está eliminado' AS Mensaje;
            END IF;
        END IF;

    ELSEIF p_Accion = 'SELECT' THEN
        IF p_idUsuario IS NOT NULL THEN
            -- Seleccionar un usuario específico
            SELECT * FROM usuario WHERE idUsuario = p_idUsuario;
        ELSEIF p_dni IS NOT NULL THEN
            -- Buscar por DNI (solo activos)
            SELECT * FROM usuario WHERE dni = p_dni AND activo = TRUE;
        ELSEIF p_email IS NOT NULL THEN
            -- Buscar por email (solo activos)
            SELECT * FROM usuario WHERE email = p_email AND activo = TRUE;
        ELSE
            -- Seleccionar todos los usuarios activos
            SELECT * FROM usuario WHERE activo = TRUE;
        END IF;

    ELSEIF p_Accion = 'SELECTALL' THEN
        -- Seleccionar TODOS los usuarios (incluyendo eliminados)
        SELECT * FROM usuario;

    ELSEIF p_Accion = 'RESTORE' THEN
        -- Restaurar un usuario eliminado lógicamente
        IF p_idUsuario IS NULL THEN
            SELECT 'Error: Se requiere idUsuario para restaurar' AS Mensaje;
        ELSE
            UPDATE usuario 
            SET activo = TRUE,
                fecha_eliminacion = NULL
            WHERE idUsuario = p_idUsuario AND activo = FALSE;
            
            IF ROW_COUNT() > 0 THEN
                SELECT p_idUsuario AS idUsuario, 'Usuario restaurado correctamente' AS Mensaje;
            ELSE
                SELECT 'Error: Usuario no encontrado o ya está activo' AS Mensaje;
            END IF;
        END IF;

    ELSE
        SELECT 'Error: Acción no válida. Use INSERT, UPDATE, DELETE, SELECT, SELECTALL o RESTORE' AS Mensaje;
    END IF;

    COMMIT;
    
  END;

-- Verificar que todo se creó correctamente
SELECT 'Base de datos y tablas creadas correctamente' AS Status;
SHOW TABLES;
SHOW PROCEDURE STATUS WHERE db = 'SistemaVoluntariado';