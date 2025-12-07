-- crear tabla Actividad
CREATE TABLE Actividad (
    idActi INT PRIMARY KEY AUTO_INCREMENT,
    idGrupoVoluntariado INT NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    duracionhoras DECIMAL(10,2) NOT NULL,
    activo BOOLEAN DEFAULT TRUE COMMENT 'TRUE = activo, FALSE = eliminado lógicamente',
    FOREIGN KEY (idGrupoVoluntariado) REFERENCES GrupoVoluntariado(idGrupoVoluntariado)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ============================================================================
-- PROCEDIMIENTO: sp_Actividad_CRUD (Versión Completa)
-- ============================================================================
CREATE PROCEDURE sp_Actividad_CRUD(
    IN p_Accion VARCHAR(10),
    IN p_idActi INT,
    IN p_idGrupoVoluntariado INT,
    IN p_nombre VARCHAR(200),
    IN p_descripcion TEXT,
    IN p_fecha DATETIME,
    IN p_duracionhoras DECIMAL(10,2)
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
        INSERT INTO Actividad (
            idGrupoVoluntariado,
            nombre,
            descripcion,
            fecha,
            duracionhoras,
            activo
        )
        VALUES (
            p_idGrupoVoluntariado,
            p_nombre,
            p_descripcion,
            IFNULL(p_fecha, CURRENT_TIMESTAMP),
            p_duracionhoras,
            TRUE
        );
        
        SELECT LAST_INSERT_ID() AS idActi, 
               'Actividad insertada correctamente' AS Mensaje;

    -- ACTUALIZAR -------------------------------------------------------------
    ELSEIF p_Accion = 'UPDATE' THEN
        IF p_idActi IS NULL THEN
            SELECT 'Error: Se requiere idActi para actualizar' AS Mensaje;
        ELSE
            UPDATE Actividad
            SET idGrupoVoluntariado = IFNULL(p_idGrupoVoluntariado, idGrupoVoluntariado),
                nombre = IFNULL(p_nombre, nombre),
                descripcion = IFNULL(p_descripcion, descripcion),
                fecha = IFNULL(p_fecha, fecha),
                duracionhoras = IFNULL(p_duracionhoras, duracionhoras)
            WHERE idActi = p_idActi AND activo = TRUE;
            
            IF ROW_COUNT() > 0 THEN
                SELECT p_idActi AS idActi, 
                       'Actividad actualizada correctamente' AS Mensaje;
            ELSE
                SELECT 'Error: Actividad no encontrada o ya está eliminada' AS Mensaje;
            END IF;
        END IF;

    -- DELETE LÓGICO ----------------------------------------------------------
    ELSEIF p_Accion = 'DELETE' THEN
        IF p_idActi IS NULL THEN
            SELECT 'Error: Se requiere idActi para eliminar' AS Mensaje;
        ELSE
            UPDATE Actividad
            SET activo = FALSE
            WHERE idActi = p_idActi AND activo = TRUE;
            
            IF ROW_COUNT() > 0 THEN
                SELECT p_idActi AS idActi, 
                       'Actividad eliminada lógicamente' AS Mensaje;
            ELSE
                SELECT 'Error: Actividad no encontrada o ya está eliminada' AS Mensaje;
            END IF;
        END IF;

    -- SELECT -----------------------------------------------------------------
    ELSEIF p_Accion = 'SELECT' THEN
        IF p_idActi IS NOT NULL THEN
            -- Seleccionar actividad específica con estadísticas
            SELECT 
                a.*,
                gv.nombreGrupoVoluntariado,
                gv.descripcion AS descripcionGrupo,
                COUNT(DISTINCT au.idUsuario) AS usuariosInscritos,
                SUM(CASE WHEN au.completado = TRUE THEN 1 ELSE 0 END) AS usuariosCompletaron,
                SUM(au.horasRealizadas) AS totalHorasRealizadas
            FROM Actividad a
            LEFT JOIN GrupoVoluntariado gv ON a.idGrupoVoluntariado = gv.idGrupoVoluntariado
            LEFT JOIN Actividad_Usuario au ON a.idActi = au.idActividad
            WHERE a.idActi = p_idActi
            GROUP BY a.idActi;
            
        ELSEIF p_idGrupoVoluntariado IS NOT NULL THEN
            -- Seleccionar todas las actividades de un grupo
            SELECT 
                a.*,
                COUNT(DISTINCT au.idUsuario) AS usuariosInscritos,
                SUM(CASE WHEN au.completado = TRUE THEN 1 ELSE 0 END) AS usuariosCompletaron
            FROM Actividad a
            LEFT JOIN Actividad_Usuario au ON a.idActi = au.idActividad
            WHERE a.idGrupoVoluntariado = p_idGrupoVoluntariado
                AND a.activo = TRUE
            GROUP BY a.idActi
            ORDER BY a.fecha ASC;
            
        ELSEIF p_nombre IS NOT NULL THEN
            -- Buscar por nombre
            SELECT 
                a.*,
                gv.nombreGrupoVoluntariado,
                COUNT(DISTINCT au.idUsuario) AS usuariosInscritos
            FROM Actividad a
            LEFT JOIN GrupoVoluntariado gv ON a.idGrupoVoluntariado = gv.idGrupoVoluntariado
            LEFT JOIN Actividad_Usuario au ON a.idActi = au.idActividad
            WHERE a.nombre LIKE CONCAT('%', p_nombre, '%')
                AND a.activo = TRUE
            GROUP BY a.idActi;
        ELSE
            -- Seleccionar todas las actividades activas
            SELECT 
                a.*,
                gv.nombreGrupoVoluntariado,
                COUNT(DISTINCT au.idUsuario) AS usuariosInscritos
            FROM Actividad a
            LEFT JOIN GrupoVoluntariado gv ON a.idGrupoVoluntariado = gv.idGrupoVoluntariado
            LEFT JOIN Actividad_Usuario au ON a.idActi = au.idActividad
            WHERE a.activo = TRUE
            GROUP BY a.idActi
            ORDER BY a.fecha DESC;
        END IF;

    -- SELECT ALL (incluye eliminadas) ----------------------------------------
    ELSEIF p_Accion = 'SELECTALL' THEN
        SELECT 
            a.*,
            gv.nombreGrupoVoluntariado,
            COUNT(DISTINCT au.idUsuario) AS usuariosInscritos
        FROM Actividad a
        LEFT JOIN GrupoVoluntariado gv ON a.idGrupoVoluntariado = gv.idGrupoVoluntariado
        LEFT JOIN Actividad_Usuario au ON a.idActi = au.idActividad
        GROUP BY a.idActi
        ORDER BY a.fecha DESC;

    -- RESTORE ----------------------------------------------------------------
    ELSEIF p_Accion = 'RESTORE' THEN
        IF p_idActi IS NULL THEN
            SELECT 'Error: Se requiere idActi para restaurar' AS Mensaje;
        ELSE
            UPDATE Actividad
            SET activo = TRUE
            WHERE idActi = p_idActi AND activo = FALSE;
            
            IF ROW_COUNT() > 0 THEN
                SELECT p_idActi AS idActi, 
                       'Actividad restaurada correctamente' AS Mensaje;
            ELSE
                SELECT 'Error: Actividad no encontrada o ya está activa' AS Mensaje;
            END IF;
        END IF;

    -- PROGRESO DE ACTIVIDAD --------------------------------------------------
    ELSEIF p_Accion = 'PROGRESS' THEN
        IF p_idActi IS NULL THEN
            SELECT 'Error: Se requiere idActi para ver progreso' AS Mensaje;
        ELSE
            SELECT 
                a.idActi,
                a.nombre,
                a.duracionhoras AS horasRequeridas,
                COUNT(DISTINCT au.idUsuario) AS usuariosInscritos,
                SUM(CASE WHEN au.completado = TRUE THEN 1 ELSE 0 END) AS usuariosCompletaron,
                AVG(au.horasRealizadas) AS promedioHorasRealizadas,
                SUM(au.horasRealizadas) AS totalHorasRealizadas,
                ROUND((SUM(CASE WHEN au.completado = TRUE THEN 1 ELSE 0 END) * 100.0 / 
                    NULLIF(COUNT(DISTINCT au.idUsuario), 0)), 2) AS porcentajeCompletado
            FROM Actividad a
            LEFT JOIN Actividad_Usuario au ON a.idActi = au.idActividad
            WHERE a.idActi = p_idActi
            GROUP BY a.idActi;
        END IF;

    -- USUARIOS DE ACTIVIDAD --------------------------------------------------
    ELSEIF p_Accion = 'USERS' THEN
        IF p_idActi IS NULL THEN
            SELECT 'Error: Se requiere idActi para ver usuarios' AS Mensaje;
        ELSE
            SELECT 
                u.idUsuario,
                u.nombre,
                u.apPaterno,
                u.apMaterno,
                u.email,
                au.horasRealizadas,
                au.completado,
                au.fechaCompletado,
                CASE 
                    WHEN au.completado = TRUE THEN 'Completado'
                    ELSE 'En Progreso'
                END AS estado
            FROM Actividad_Usuario au
            INNER JOIN usuario u ON au.idUsuario = u.idUsuario
            WHERE au.idActividad = p_idActi
            ORDER BY au.completado DESC, u.nombre ASC;
        END IF;

    -- ACTIVIDADES PENDIENTES -------------------------------------------------
    ELSEIF p_Accion = 'PENDING' THEN
        IF p_idGrupoVoluntariado IS NOT NULL THEN
            -- Actividades pendientes de un grupo específico
            SELECT 
                a.*,
                COUNT(DISTINCT au.idUsuario) AS usuariosInscritos,
                SUM(CASE WHEN au.completado = FALSE THEN 1 ELSE 0 END) AS usuariosPendientes
            FROM Actividad a
            LEFT JOIN Actividad_Usuario au ON a.idActi = au.idActividad
            WHERE a.idGrupoVoluntariado = p_idGrupoVoluntariado
                AND a.activo = TRUE
                AND a.fecha >= CURRENT_DATE
            GROUP BY a.idActi
            HAVING usuariosPendientes > 0
            ORDER BY a.fecha ASC;
        ELSE
            -- Todas las actividades pendientes
            SELECT 
                a.*,
                gv.nombreGrupoVoluntariado,
                COUNT(DISTINCT au.idUsuario) AS usuariosInscritos,
                SUM(CASE WHEN au.completado = FALSE THEN 1 ELSE 0 END) AS usuariosPendientes
            FROM Actividad a
            LEFT JOIN GrupoVoluntariado gv ON a.idGrupoVoluntariado = gv.idGrupoVoluntariado
            LEFT JOIN Actividad_Usuario au ON a.idActi = au.idActividad
            WHERE a.activo = TRUE
                AND a.fecha >= CURRENT_DATE
            GROUP BY a.idActi
            HAVING usuariosPendientes > 0
            ORDER BY a.fecha ASC;
        END IF;

    -- ACTIVIDADES COMPLETADAS ------------------------------------------------
    ELSEIF p_Accion = 'COMPLETED' THEN
        IF p_idGrupoVoluntariado IS NOT NULL THEN
            SELECT 
                a.*,
                COUNT(DISTINCT au.idUsuario) AS usuariosCompletaron
            FROM Actividad a
            INNER JOIN Actividad_Usuario au ON a.idActi = au.idActividad AND au.completado = TRUE
            WHERE a.idGrupoVoluntariado = p_idGrupoVoluntariado
                AND a.activo = TRUE
            GROUP BY a.idActi
            ORDER BY a.fecha DESC;
        ELSE
            SELECT 
                a.*,
                gv.nombreGrupoVoluntariado,
                COUNT(DISTINCT au.idUsuario) AS usuariosCompletaron
            FROM Actividad a
            INNER JOIN GrupoVoluntariado gv ON a.idGrupoVoluntariado = gv.idGrupoVoluntariado
            INNER JOIN Actividad_Usuario au ON a.idActi = au.idActividad AND au.completado = TRUE
            WHERE a.activo = TRUE
            GROUP BY a.idActi
            ORDER BY a.fecha DESC;
        END IF;

    -- ACCIÓN INVÁLIDA --------------------------------------------------------
    ELSE
        SELECT 'Error: Acción no válida. Use INSERT, UPDATE, DELETE, SELECT, SELECTALL, RESTORE, PROGRESS, USERS, PENDING o COMPLETED' AS Mensaje;
    END IF;

    COMMIT;
END



-- CREATE PROCEDURE sp_Actividad_CRUD(
--     IN p_Accion VARCHAR(10),
--     IN p_idActi INT,
--     IN p_idGrupoVoluntariado INT,
--     IN p_nombre VARCHAR(200),
--     IN p_descripcion TEXT,
--     IN p_fecha DATETIME,
--     IN p_duracionhoras DECIMAL(10,2)
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

--     -- INSERTAR ---------------------------------------------------------------
--     IF p_Accion = 'INSERT' THEN
--         INSERT INTO Actividad (
--             idGrupoVoluntariado,
--             nombre,
--             descripcion,
--             fecha,
--             duracionhoras,
--             activo
--         )
--         VALUES (
--             p_idGrupoVoluntariado,
--             p_nombre,
--             p_descripcion,
--             IFNULL(p_fecha, CURRENT_TIMESTAMP),
--             p_duracionhoras,
--             TRUE
--         );
        
--         SELECT LAST_INSERT_ID() AS idActi, 
--                'Actividad insertada correctamente' AS Mensaje;

--     -- ACTUALIZAR -------------------------------------------------------------
--     ELSEIF p_Accion = 'UPDATE' THEN
--         IF p_idActi IS NULL THEN
--             SELECT 'Error: Se requiere idActi para actualizar' AS Mensaje;
--         ELSE
--             UPDATE Actividad
--             SET idGrupoVoluntariado = IFNULL(p_idGrupoVoluntariado, idGrupoVoluntariado),
--                 nombre = IFNULL(p_nombre, nombre),
--                 descripcion = IFNULL(p_descripcion, descripcion),
--                 fecha = IFNULL(p_fecha, fecha),
--                 duracionhoras = IFNULL(p_duracionhoras, duracionhoras)
--             WHERE idActi = p_idActi AND activo = TRUE;
            
--             IF ROW_COUNT() > 0 THEN
--                 SELECT p_idActi AS idActi, 
--                        'Actividad actualizada correctamente' AS Mensaje;
--             ELSE
--                 SELECT 'Error: Actividad no encontrada o ya está eliminada' AS Mensaje;
--             END IF;
--         END IF;

--     -- DELETE LÓGICO ----------------------------------------------------------
--     ELSEIF p_Accion = 'DELETE' THEN
--         IF p_idActi IS NULL THEN
--             SELECT 'Error: Se requiere idActi para eliminar' AS Mensaje;
--         ELSE
--             UPDATE Actividad
--             SET activo = FALSE
--             WHERE idActi = p_idActi AND activo = TRUE;
            
--             IF ROW_COUNT() > 0 THEN
--                 SELECT p_idActi AS idActi, 
--                        'Actividad eliminada lógicamente' AS Mensaje;
--             ELSE
--                 SELECT 'Error: Actividad no encontrada o ya está eliminada' AS Mensaje;
--             END IF;
--         END IF;

--     -- SELECT -----------------------------------------------------------------
--     ELSEIF p_Accion = 'SELECT' THEN
--         IF p_idActi IS NOT NULL THEN
--             SELECT a.*,
--                    gv.nombreGrupoVoluntariado,
--                    COUNT(DISTINCT au.idUsuario) AS usuariosCompletaron
--             FROM Actividad a
--             LEFT JOIN GrupoVoluntariado gv ON a.idGrupoVoluntariado = gv.idGrupoVoluntariado
--             LEFT JOIN Actividad_Usuario au ON a.idActi = au.idActividad AND au.completado = TRUE
--             WHERE a.idActi = p_idActi
--             GROUP BY a.idActi;
            
--         ELSEIF p_idGrupoVoluntariado IS NOT NULL THEN
--             SELECT a.*,
--                    COUNT(DISTINCT au.idUsuario) AS usuariosCompletaron
--             FROM Actividad a
--             LEFT JOIN Actividad_Usuario au ON a.idActi = au.idActividad AND au.completado = TRUE
--             WHERE a.idGrupoVoluntariado = p_idGrupoVoluntariado
--                 AND a.activo = TRUE
--             GROUP BY a.idActi;
--         ELSE
--             SELECT a.*,
--                    gv.nombreGrupoVoluntariado,
--                    COUNT(DISTINCT au.idUsuario) AS usuariosCompletaron
--             FROM Actividad a
--             LEFT JOIN GrupoVoluntariado gv ON a.idGrupoVoluntariado = gv.idGrupoVoluntariado
--             LEFT JOIN Actividad_Usuario au ON a.idActi = au.idActividad AND au.completado = TRUE
--             WHERE a.activo = TRUE
--             GROUP BY a.idActi;
--         END IF;

--     -- SELECT ALL -------------------------------------------------------------
--     ELSEIF p_Accion = 'SELECTALL' THEN
--         SELECT a.*,
--                gv.nombreGrupoVoluntariado
--         FROM Actividad a
--         LEFT JOIN GrupoVoluntariado gv ON a.idGrupoVoluntariado = gv.idGrupoVoluntariado;

--     -- RESTORE ----------------------------------------------------------------
--     ELSEIF p_Accion = 'RESTORE' THEN
--         IF p_idActi IS NULL THEN
--             SELECT 'Error: Se requiere idActi para restaurar' AS Mensaje;
--         ELSE
--             UPDATE Actividad
--             SET activo = TRUE
--             WHERE idActi = p_idActi AND activo = FALSE;
            
--             IF ROW_COUNT() > 0 THEN
--                 SELECT p_idActi AS idActi, 
--                        'Actividad restaurada correctamente' AS Mensaje;
--             ELSE
--                 SELECT 'Error: Actividad no encontrada o ya está activa' AS Mensaje;
--             END IF;
--         END IF;

--     ELSE
--         SELECT 'Error: Acción no válida. Use INSERT, UPDATE, DELETE, SELECT, SELECTALL o RESTORE' AS Mensaje;
--     END IF;

--     COMMIT;
-- END