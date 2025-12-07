CREATE TABLE GrupoVoluntariado (
    idGrupoVoluntariado INT PRIMARY KEY AUTO_INCREMENT,
    nombreGrupoVoluntariado VARCHAR(200) NOT NULL,
    fechaCreacionGrupoVoluntariado DATETIME DEFAULT CURRENT_TIMESTAMP,
    duracionHoras DECIMAL(10,2) NOT NULL,
    duracionDias INT,
    maxMiembros INT DEFAULT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE COMMENT 'TRUE = activo, FALSE = eliminado lógicamente'
);
-- ============================================================================
-- PROCEDIMIENTO: sp_GrupoVoluntariado_CRUD
-- ============================================================================
CREATE PROCEDURE sp_GrupoVoluntariado_CRUD(
    IN p_Accion VARCHAR(10),
    IN p_idGrupoVoluntariado INT,
    IN p_nombreGrupoVoluntariado VARCHAR(200),
    IN p_fechaCreacion DATETIME,
    IN p_duracionHoras DECIMAL(10,2),
    IN p_duracionDias INT,
    IN p_maxMiembros INT,
    IN p_descripcion TEXT
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
        INSERT INTO GrupoVoluntariado (
            nombreGrupoVoluntariado, 
            fechaCreacionGrupoVoluntariado,
            duracionHoras,
            duracionDias,
            maxMiembros,
            descripcion,
            activo
        )
        VALUES (
            p_nombreGrupoVoluntariado,
            IFNULL(p_fechaCreacion, CURRENT_TIMESTAMP),
            p_duracionHoras,
            p_duracionDias,
            p_maxMiembros,
            p_descripcion,
            TRUE
        );
        
        SELECT LAST_INSERT_ID() AS idGrupoVoluntariado, 
               'Grupo de Voluntariado insertado correctamente' AS Mensaje;

    -- ACTUALIZAR -------------------------------------------------------------
    ELSEIF p_Accion = 'UPDATE' THEN
        IF p_idGrupoVoluntariado IS NULL THEN
            SELECT 'Error: Se requiere idGrupoVoluntariado para actualizar' AS Mensaje;
        ELSE
            UPDATE GrupoVoluntariado
            SET nombreGrupoVoluntariado = IFNULL(p_nombreGrupoVoluntariado, nombreGrupoVoluntariado),
                duracionHoras = IFNULL(p_duracionHoras, duracionHoras),
                duracionDias = IFNULL(p_duracionDias, duracionDias),
                maxMiembros = IFNULL(p_maxMiembros, maxMiembros),
                descripcion = IFNULL(p_descripcion, descripcion)
            WHERE idGrupoVoluntariado = p_idGrupoVoluntariado AND activo = TRUE;
            
            IF ROW_COUNT() > 0 THEN
                SELECT p_idGrupoVoluntariado AS idGrupoVoluntariado, 
                       'Grupo de Voluntariado actualizado correctamente' AS Mensaje;
            ELSE
                SELECT 'Error: Grupo no encontrado o ya está eliminado' AS Mensaje;
            END IF;
        END IF;

    -- DELETE LÓGICO ----------------------------------------------------------
    ELSEIF p_Accion = 'DELETE' THEN
        IF p_idGrupoVoluntariado IS NULL THEN
            SELECT 'Error: Se requiere idGrupoVoluntariado para eliminar' AS Mensaje;
        ELSE
            UPDATE GrupoVoluntariado
            SET activo = FALSE
            WHERE idGrupoVoluntariado = p_idGrupoVoluntariado AND activo = TRUE;
            
            IF ROW_COUNT() > 0 THEN
                SELECT p_idGrupoVoluntariado AS idGrupoVoluntariado, 
                       'Grupo eliminado lógicamente' AS Mensaje;
            ELSE
                SELECT 'Error: Grupo no encontrado o ya está eliminado' AS Mensaje;
            END IF;
        END IF;

    -- SELECT -----------------------------------------------------------------
    ELSEIF p_Accion = 'SELECT' THEN
        IF p_idGrupoVoluntariado IS NOT NULL THEN
            -- Seleccionar grupo específico con información de miembros
            SELECT 
                gv.*,
                COUNT(DISTINCT gvu.idUsuario) AS numeroMiembros,
                SUM(a.duracionhoras) AS totalHorasActividades
            FROM GrupoVoluntariado gv
            LEFT JOIN GrupoVoluntariado_Usuario gvu ON gv.idGrupoVoluntariado = gvu.idGrupoVoluntariado 
                AND gvu.activo = TRUE
            LEFT JOIN Actividad a ON gv.idGrupoVoluntariado = a.idGrupoVoluntariado 
                AND a.activo = TRUE
            WHERE gv.idGrupoVoluntariado = p_idGrupoVoluntariado
            GROUP BY gv.idGrupoVoluntariado;
            
        ELSEIF p_nombreGrupoVoluntariado IS NOT NULL THEN
            SELECT 
                gv.*,
                COUNT(DISTINCT gvu.idUsuario) AS numeroMiembros
            FROM GrupoVoluntariado gv
            LEFT JOIN GrupoVoluntariado_Usuario gvu ON gv.idGrupoVoluntariado = gvu.idGrupoVoluntariado 
                AND gvu.activo = TRUE
            WHERE gv.nombreGrupoVoluntariado LIKE CONCAT('%', p_nombreGrupoVoluntariado, '%')
                AND gv.activo = TRUE
            GROUP BY gv.idGrupoVoluntariado;
        ELSE
            SELECT 
                gv.*,
                COUNT(DISTINCT gvu.idUsuario) AS numeroMiembros
            FROM GrupoVoluntariado gv
            LEFT JOIN GrupoVoluntariado_Usuario gvu ON gv.idGrupoVoluntariado = gvu.idGrupoVoluntariado 
                AND gvu.activo = TRUE
            WHERE gv.activo = TRUE
            GROUP BY gv.idGrupoVoluntariado;
        END IF;

    -- SELECT ALL -------------------------------------------------------------
    ELSEIF p_Accion = 'SELECTALL' THEN
        SELECT 
            gv.*,
            COUNT(DISTINCT gvu.idUsuario) AS numeroMiembros
        FROM GrupoVoluntariado gv
        LEFT JOIN GrupoVoluntariado_Usuario gvu ON gv.idGrupoVoluntariado = gvu.idGrupoVoluntariado
        GROUP BY gv.idGrupoVoluntariado;

    -- RESTORE ----------------------------------------------------------------
    ELSEIF p_Accion = 'RESTORE' THEN
        IF p_idGrupoVoluntariado IS NULL THEN
            SELECT 'Error: Se requiere idGrupoVoluntariado para restaurar' AS Mensaje;
        ELSE
            UPDATE GrupoVoluntariado
            SET activo = TRUE
            WHERE idGrupoVoluntariado = p_idGrupoVoluntariado AND activo = FALSE;
            
            IF ROW_COUNT() > 0 THEN
                SELECT p_idGrupoVoluntariado AS idGrupoVoluntariado, 
                       'Grupo restaurado correctamente' AS Mensaje;
            ELSE
                SELECT 'Error: Grupo no encontrado o ya está activo' AS Mensaje;
            END IF;
        END IF;

    ELSE
        SELECT 'Error: Acción no válida. Use INSERT, UPDATE, DELETE, SELECT, SELECTALL o RESTORE' AS Mensaje;
    END IF;

    COMMIT;
END