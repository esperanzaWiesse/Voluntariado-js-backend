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
    fecha_eliminacion TIMESTAMP NULL COMMENT 'Fecha cuando se eliminó lógicamente',
    rol VARCHAR(100) NOT NULL DEFAULT 'VISITANTE'
);


-- ============================================================================
-- PROCEDIMIENTO: sp_Usuario_CRUD
-- ============================================================================
CREATE PROCEDURE sp_Usuario_CRUD(
    IN p_Accion VARCHAR(10),
    IN p_idUsuario INT,
    IN p_nombre VARCHAR(200),
    IN p_apPaterno VARCHAR(200),
    IN p_apMaterno VARCHAR(200),
    IN p_dni VARCHAR(20),
    IN p_email VARCHAR(200),
    IN p_password VARCHAR(255),
    IN p_codUniversitario VARCHAR(50),
    IN p_tipoCodUniversitario VARCHAR(100),
    IN p_rol VARCHAR(100)
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

    -- INSERTAR ---------------------------------------------------------------
    IF p_Accion = 'INSERT' THEN
        INSERT INTO usuario (
            nombre,
            apPaterno,
            apMaterno,
            dni,
            email,
            password,
            codUniversitario,
            tipoCodUniversitario,
            activo,
            fecha_creacion,
            rol
        )
        VALUES (
            p_nombre,
            p_apPaterno,
            p_apMaterno,
            p_dni,
            p_email,
            p_password,
            p_codUniversitario,
            p_tipoCodUniversitario,
            TRUE,
            CURRENT_TIMESTAMP,
            p_rol
        );
        
        SELECT LAST_INSERT_ID() AS idUsuario, 
               'Usuario insertado correctamente' AS Mensaje;

    -- ACTUALIZAR -------------------------------------------------------------
    ELSEIF p_Accion = 'UPDATE' THEN
        IF p_idUsuario IS NULL THEN
            SELECT 'Error: Se requiere idUsuario para actualizar' AS Mensaje;
        ELSE
            UPDATE usuario
            SET nombre = IFNULL(p_nombre, nombre),
                apPaterno = IFNULL(p_apPaterno, apPaterno),
                apMaterno = IFNULL(p_apMaterno, apMaterno),
                dni = IFNULL(p_dni, dni),
                email = IFNULL(p_email, email),
                password = IFNULL(p_password, password),
                codUniversitario = IFNULL(p_codUniversitario, codUniversitario),
                tipoCodUniversitario = IFNULL(p_tipoCodUniversitario, tipoCodUniversitario),
                rol = IFNULL(p_rol, rol),
                fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE idUsuario = p_idUsuario AND activo = TRUE;
            
            IF ROW_COUNT() > 0 THEN
                SELECT p_idUsuario AS idUsuario, 
                       'Usuario actualizado correctamente' AS Mensaje;
            ELSE
                SELECT 'Error: Usuario no encontrado o ya está eliminado' AS Mensaje;
            END IF;
        END IF;

    -- DELETE LÓGICO ----------------------------------------------------------
    ELSEIF p_Accion = 'DELETE' THEN
        IF p_idUsuario IS NULL THEN
            SELECT 'Error: Se requiere idUsuario para eliminar' AS Mensaje;
        ELSE
            UPDATE usuario
            SET activo = FALSE,
                fecha_eliminacion = CURRENT_TIMESTAMP
            WHERE idUsuario = p_idUsuario AND activo = TRUE;
            
            IF ROW_COUNT() > 0 THEN
                SELECT p_idUsuario AS idUsuario, 
                       'Usuario eliminado lógicamente' AS Mensaje;
            ELSE
                SELECT 'Error: Usuario no encontrado o ya está eliminado' AS Mensaje;
            END IF;
        END IF;

    -- SELECT -----------------------------------------------------------------
    ELSEIF p_Accion = 'SELECT' THEN
        IF p_idUsuario IS NOT NULL THEN
            -- Seleccionar usuario específico con estadísticas
            SELECT 
                u.*,
                COUNT(DISTINCT gvu.idGrupoVoluntariado) AS gruposInscritos,
                COUNT(DISTINCT c.idCertificado) AS certificadosObtenidos,
                SUM(au.horasRealizadas) AS totalHorasVoluntariado
            FROM usuario u
            LEFT JOIN GrupoVoluntariado_Usuario gvu ON u.idUsuario = gvu.idUsuario AND gvu.activo = TRUE
            LEFT JOIN Certificado c ON u.idUsuario = c.idUsuario AND c.activo = TRUE
            LEFT JOIN Actividad_Usuario au ON u.idUsuario = au.idUsuario AND au.completado = TRUE
            WHERE u.idUsuario = p_idUsuario
            GROUP BY u.idUsuario;
            
        ELSEIF p_email IS NOT NULL THEN
            -- Buscar por email (para login)
            SELECT u.*
            FROM usuario u
            WHERE u.email = p_email
                AND u.activo = TRUE;
                
        ELSEIF p_dni IS NOT NULL THEN
            -- Buscar por DNI
            SELECT u.*
            FROM usuario u
            WHERE u.dni = p_dni AND u.activo = TRUE;
                
        ELSEIF p_rol IS NOT NULL THEN
            -- Buscar por rol de sistema
            SELECT u.*,
                   COUNT(DISTINCT gvu.idGrupoVoluntariado) AS gruposInscritos
            FROM usuario u
            LEFT JOIN GrupoVoluntariado_Usuario gvu ON u.idUsuario = gvu.idUsuario AND gvu.activo = TRUE
            WHERE u.rol = p_rol
                AND u.activo = TRUE
            GROUP BY u.idUsuario;
            
        ELSEIF p_nombre IS NOT NULL THEN
            -- Buscar por nombre
            SELECT u.*
            FROM usuario u
            WHERE (u.nombre LIKE CONCAT('%', p_nombre, '%')
                OR u.apPaterno LIKE CONCAT('%', p_nombre, '%')
                OR u.apMaterno LIKE CONCAT('%', p_nombre, '%'))
                AND u.activo = TRUE;
        ELSE
            -- Seleccionar todos los usuarios activos
            SELECT u.*,
                   COUNT(DISTINCT gvu.idGrupoVoluntariado) AS gruposInscritos
            FROM usuario u
            LEFT JOIN GrupoVoluntariado_Usuario gvu ON u.idUsuario = gvu.idUsuario AND gvu.activo = TRUE
            WHERE u.activo = TRUE
            GROUP BY u.idUsuario;
        END IF;

    -- SELECT ALL (incluye eliminados) ----------------------------------------
    ELSEIF p_Accion = 'SELECTALL' THEN
        SELECT u.*,
               COUNT(DISTINCT gvu.idGrupoVoluntariado) AS gruposInscritos,
               COUNT(DISTINCT c.idCertificado) AS certificadosObtenidos
        FROM usuario u
        LEFT JOIN GrupoVoluntariado_Usuario gvu ON u.idUsuario = gvu.idUsuario
        LEFT JOIN Certificado c ON u.idUsuario = c.idUsuario
        GROUP BY u.idUsuario;

    -- RESTORE ----------------------------------------------------------------
    ELSEIF p_Accion = 'RESTORE' THEN
        IF p_idUsuario IS NULL THEN
            SELECT 'Error: Se requiere idUsuario para restaurar' AS Mensaje;
        ELSE
            UPDATE usuario
            SET activo = TRUE,
                fecha_eliminacion = NULL
            WHERE idUsuario = p_idUsuario AND activo = FALSE;
            
            IF ROW_COUNT() > 0 THEN
                SELECT p_idUsuario AS idUsuario, 
                       'Usuario restaurado correctamente' AS Mensaje;
            ELSE
                SELECT 'Error: Usuario no encontrado o ya está activo' AS Mensaje;
            END IF;
        END IF;

    -- ESTADÍSTICAS DE USUARIO ------------------------------------------------
    ELSEIF p_Accion = 'STATS' THEN
        IF p_idUsuario IS NULL THEN
            SELECT 'Error: Se requiere idUsuario para ver estadísticas' AS Mensaje;
        ELSE
            SELECT 
                u.idUsuario,
                u.nombre,
                u.apPaterno,
                u.apMaterno,
                u.email,
                COUNT(DISTINCT gvu.idGrupoVoluntariado) AS gruposActivos,
                COUNT(DISTINCT au.idActividad) AS actividadesCompletadas,
                SUM(au.horasRealizadas) AS totalHorasVoluntariado,
                COUNT(DISTINCT c.idCertificado) AS certificadosObtenidos
            FROM usuario u
            LEFT JOIN GrupoVoluntariado_Usuario gvu ON u.idUsuario = gvu.idUsuario AND gvu.activo = TRUE
            LEFT JOIN Actividad_Usuario au ON u.idUsuario = au.idUsuario AND au.completado = TRUE
            LEFT JOIN Certificado c ON u.idUsuario = c.idUsuario AND c.activo = TRUE
            WHERE u.idUsuario = p_idUsuario
            GROUP BY u.idUsuario;
        END IF;

    -- ACCIÓN INVÁLIDA --------------------------------------------------------
    ELSE
        SELECT 'Error: Acción no válida. Use INSERT, UPDATE, DELETE, SELECT, SELECTALL, RESTORE, LOGIN, CHANGEPASS o STATS' AS Mensaje;
    END IF;

    COMMIT;
END


-- Procedimiento almacenado CRUD para Usuario con delete lógico
-- CREATE PROCEDURE sp_Usuario_CRUD(
--     IN p_Accion VARCHAR(10),
--     IN p_idUsuario INT,
--     IN p_nombre VARCHAR(100),
--     IN p_apPaterno VARCHAR(100),
--     IN p_apMaterno VARCHAR(100),
--     IN p_dni INT,
--     IN p_rol VARCHAR(100),
--     IN p_email VARCHAR(150),
--     IN p_password VARCHAR(255),
--     IN p_codUniversitario VARCHAR(20),
--     IN p_tipoCodUniversitario VARCHAR(50)
-- )
-- BEGIN
--     DECLARE EXIT HANDLER FOR SQLEXCEPTION
--     BEGIN
--         GET DIAGNOSTICS CONDITION 1
--             @sqlstate = RETURNED_SQLSTATE, 
--             @errno = MYSQL_ERRNO, 
--             @text = MESSAGE_TEXT;
--         SELECT @errno AS ErrorNumber, @text AS ErrorMessage;
--         ROLLBACK;
--     END;

--     START TRANSACTION;

--     IF p_Accion = 'INSERT' THEN
--         INSERT INTO usuario (nombre, apPaterno, apMaterno, dni, rol, email, password, codUniversitario, tipoCodUniversitario, activo)
--         VALUES (p_nombre, p_apPaterno, p_apMaterno, p_dni, p_rol, p_email, p_password, p_codUniversitario, p_tipoCodUniversitario, TRUE);
        
--         SELECT LAST_INSERT_ID() AS idUsuario, 'Usuario insertado correctamente' AS Mensaje;

--     ELSEIF p_Accion = 'UPDATE' THEN
--         IF p_idUsuario IS NULL THEN
--             SELECT 'Error: Se requiere idUsuario para actualizar' AS Mensaje;
--         ELSE
--             UPDATE usuario
--             SET nombre = IFNULL(p_nombre, nombre),
--                 apPaterno = IFNULL(p_apPaterno, apPaterno),
--                 apMaterno = IFNULL(p_apMaterno, apMaterno),
--                 dni = IFNULL(p_dni, dni),
--                 rol = IFNULL(p_rol, rol),
--                 email = IFNULL(p_email, email),
--                 password = IFNULL(p_password, password),
--                 codUniversitario = IFNULL(p_codUniversitario, codUniversitario),
--                 tipoCodUniversitario = IFNULL(p_tipoCodUniversitario, tipoCodUniversitario)
--             WHERE idUsuario = p_idUsuario AND activo = TRUE;
            
--             IF ROW_COUNT() > 0 THEN
--                 SELECT p_idUsuario AS idUsuario, 'Usuario actualizado correctamente' AS Mensaje;
--             ELSE
--                 SELECT 'Error: Usuario no encontrado o ya está eliminado' AS Mensaje;
--             END IF;
--         END IF;

--     ELSEIF p_Accion = 'DELETE' THEN
--         IF p_idUsuario IS NULL THEN
--             SELECT 'Error: Se requiere idUsuario para eliminar' AS Mensaje;
--         ELSE
--             -- Delete lógico: marcar como inactivo y registrar fecha de eliminación
--             UPDATE usuario 
--             SET activo = FALSE,
--                 fecha_eliminacion = CURRENT_TIMESTAMP
--             WHERE idUsuario = p_idUsuario AND activo = TRUE;
            
--             IF ROW_COUNT() > 0 THEN
--                 SELECT p_idUsuario AS idUsuario, 'Usuario eliminado lógicamente' AS Mensaje;
--             ELSE
--                 SELECT 'Error: Usuario no encontrado o ya está eliminado' AS Mensaje;
--             END IF;
--         END IF;

--     ELSEIF p_Accion = 'SELECT' THEN
--         IF p_idUsuario IS NOT NULL THEN
--             -- Seleccionar un usuario específico
--             SELECT * FROM usuario WHERE idUsuario = p_idUsuario;
--         ELSEIF p_dni IS NOT NULL THEN
--             -- Buscar por DNI (solo activos)
--             SELECT * FROM usuario WHERE dni = p_dni AND activo = TRUE;
--         ELSEIF p_email IS NOT NULL THEN
--             -- Buscar por email (solo activos)
--             SELECT * FROM usuario WHERE email = p_email AND activo = TRUE;
--         ELSE
--             -- Seleccionar todos los usuarios activos
--             SELECT * FROM usuario WHERE activo = TRUE;
--         END IF;

--     ELSEIF p_Accion = 'SELECTALL' THEN
--         -- Seleccionar TODOS los usuarios (incluyendo eliminados)
--         SELECT * FROM usuario;

--     ELSEIF p_Accion = 'RESTORE' THEN
--         -- Restaurar un usuario eliminado lógicamente
--         IF p_idUsuario IS NULL THEN
--             SELECT 'Error: Se requiere idUsuario para restaurar' AS Mensaje;
--         ELSE
--             UPDATE usuario 
--             SET activo = TRUE,
--                 fecha_eliminacion = NULL
--             WHERE idUsuario = p_idUsuario AND activo = FALSE;
            
--             IF ROW_COUNT() > 0 THEN
--                 SELECT p_idUsuario AS idUsuario, 'Usuario restaurado correctamente' AS Mensaje;
--             ELSE
--                 SELECT 'Error: Usuario no encontrado o ya está activo' AS Mensaje;
--             END IF;
--         END IF;

--     ELSE
--         SELECT 'Error: Acción no válida. Use INSERT, UPDATE, DELETE, SELECT, SELECTALL o RESTORE' AS Mensaje;
--     END IF;

--     COMMIT;
    
--   END;

-- -- Verificar que todo se creó correctamente
-- SELECT 'Base de datos y tablas creadas correctamente' AS Status;
-- SHOW TABLES;
-- SHOW PROCEDURE STATUS WHERE db = 'SistemaVoluntariado';