
CREATE TABLE GrupoVoluntariado_Usuario (
    idGrupoVoluntariado INT NOT NULL,
    idUsuario INT NOT NULL,
    idCargo INT NOT NULL,
    fechaInscripcion DATETIME DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE COMMENT 'TRUE = activo, FALSE = eliminado lógicamente',
    PRIMARY KEY (idGrupoVoluntariado, idUsuario),
    FOREIGN KEY (idGrupoVoluntariado) REFERENCES GrupoVoluntariado(idGrupoVoluntariado)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (idUsuario) REFERENCES usuario(idUsuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (idCargo) REFERENCES Cargo(idCargo)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);
-- ============================================================================
-- PROCEDIMIENTO: sp_GrupoVoluntariado_Usuario_CRUD
-- ============================================================================
CREATE PROCEDURE sp_GrupoVoluntariado_Usuario_CRUD(
    IN p_Accion VARCHAR(10),
    IN p_idGrupoVoluntariado INT,
    IN p_idUsuario INT,
    IN p_idCargo INT,
    IN p_fechaInscripcion DATETIME
)
proc_label: BEGIN  -- Agregamos una etiqueta al bloque principal
    DECLARE v_maxMiembros INT;
    DECLARE v_numMiembros INT;
    
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

    -- INSERTAR (Inscribir usuario a grupo) -----------------------------------
    IF p_Accion = 'INSERT' THEN
        -- Verificar si el grupo tiene límite de miembros
        SELECT maxMiembros INTO v_maxMiembros
        FROM GrupoVoluntariado
        WHERE idGrupoVoluntariado = p_idGrupoVoluntariado AND activo = TRUE;
        
        IF v_maxMiembros IS NOT NULL THEN
            SELECT COUNT(*) INTO v_numMiembros
            FROM GrupoVoluntariado_Usuario
            WHERE idGrupoVoluntariado = p_idGrupoVoluntariado AND activo = TRUE;
            
            IF v_numMiembros >= v_maxMiembros THEN
                SELECT 'Error: El grupo ha alcanzado el número máximo de miembros' AS Mensaje;
                ROLLBACK;
                LEAVE proc_label;  -- Ahora usamos la etiqueta
            END IF;
        END IF;
        
        INSERT INTO GrupoVoluntariado_Usuario (
            idGrupoVoluntariado,
            idUsuario,
            idCargo,
            fechaInscripcion,
            activo
        )
        VALUES (
            p_idGrupoVoluntariado,
            p_idUsuario,
            p_idCargo,
            IFNULL(p_fechaInscripcion, CURRENT_TIMESTAMP),
            TRUE
        );
        
        SELECT p_idGrupoVoluntariado AS idGrupoVoluntariado,
               p_idUsuario AS idUsuario,
               'Usuario inscrito al grupo correctamente' AS Mensaje;

    -- ACTUALIZAR (Cambiar cargo del usuario) --------------------------------
    ELSEIF p_Accion = 'UPDATE' THEN
        IF p_idGrupoVoluntariado IS NULL OR p_idUsuario IS NULL THEN
            SELECT 'Error: Se requiere idGrupoVoluntariado e idUsuario para actualizar' AS Mensaje;
        ELSE
            UPDATE GrupoVoluntariado_Usuario
            SET idCargo = IFNULL(p_idCargo, idCargo)
            WHERE idGrupoVoluntariado = p_idGrupoVoluntariado 
                AND idUsuario = p_idUsuario 
                AND activo = TRUE;
            
            IF ROW_COUNT() > 0 THEN
                SELECT p_idGrupoVoluntariado AS idGrupoVoluntariado,
                       p_idUsuario AS idUsuario,
                       'Cargo actualizado correctamente' AS Mensaje;
            ELSE
                SELECT 'Error: Inscripción no encontrada o ya está eliminada' AS Mensaje;
            END IF;
        END IF;

    -- DELETE LÓGICO (Dar de baja del grupo) ---------------------------------
    ELSEIF p_Accion = 'DELETE' THEN
        IF p_idGrupoVoluntariado IS NULL OR p_idUsuario IS NULL THEN
            SELECT 'Error: Se requiere idGrupoVoluntariado e idUsuario para eliminar' AS Mensaje;
        ELSE
            UPDATE GrupoVoluntariado_Usuario
            SET activo = FALSE
            WHERE idGrupoVoluntariado = p_idGrupoVoluntariado 
                AND idUsuario = p_idUsuario 
                AND activo = TRUE;
            
            IF ROW_COUNT() > 0 THEN
                SELECT p_idGrupoVoluntariado AS idGrupoVoluntariado,
                       p_idUsuario AS idUsuario,
                       'Usuario dado de baja del grupo' AS Mensaje;
            ELSE
                SELECT 'Error: Inscripción no encontrada o ya está eliminada' AS Mensaje;
            END IF;
        END IF;

    -- SELECT (Consultar miembros del grupo o grupos del usuario) ------------
    ELSEIF p_Accion = 'SELECT' THEN
        IF p_idGrupoVoluntariado IS NOT NULL AND p_idUsuario IS NOT NULL THEN
            -- Consultar inscripción específica
            SELECT gvu.*,
                   u.nombre AS nombreUsuario,
                   u.apPaterno,
                   u.apMaterno,
                   u.email,
                   c.nombreCargo,
                   gv.nombreGrupoVoluntariado
            FROM GrupoVoluntariado_Usuario gvu
            INNER JOIN usuario u ON gvu.idUsuario = u.idUsuario
            INNER JOIN Cargo c ON gvu.idCargo = c.idCargo
            INNER JOIN GrupoVoluntariado gv ON gvu.idGrupoVoluntariado = gv.idGrupoVoluntariado
            WHERE gvu.idGrupoVoluntariado = p_idGrupoVoluntariado 
                AND gvu.idUsuario = p_idUsuario;
                
        ELSEIF p_idGrupoVoluntariado IS NOT NULL THEN
            -- Consultar todos los miembros de un grupo
            SELECT gvu.*,
                   u.nombre AS nombreUsuario,
                   u.apPaterno,
                   u.apMaterno,
                   u.email,
                   c.nombreCargo
            FROM GrupoVoluntariado_Usuario gvu
            INNER JOIN usuario u ON gvu.idUsuario = u.idUsuario
            INNER JOIN Cargo c ON gvu.idCargo = c.idCargo
            WHERE gvu.idGrupoVoluntariado = p_idGrupoVoluntariado 
                AND gvu.activo = TRUE;
                
        ELSEIF p_idUsuario IS NOT NULL THEN
            -- Consultar todos los grupos de un usuario
            SELECT gvu.*,
                   gv.nombreGrupoVoluntariado,
                   gv.descripcion,
                   c.nombreCargo
            FROM GrupoVoluntariado_Usuario gvu
            INNER JOIN GrupoVoluntariado gv ON gvu.idGrupoVoluntariado = gv.idGrupoVoluntariado
            INNER JOIN Cargo c ON gvu.idCargo = c.idCargo
            WHERE gvu.idUsuario = p_idUsuario 
                AND gvu.activo = TRUE;
        ELSE
            SELECT 'Error: Se requiere al menos idGrupoVoluntariado o idUsuario' AS Mensaje;
        END IF;

    -- SELECT ALL -------------------------------------------------------------
    ELSEIF p_Accion = 'SELECTALL' THEN
        SELECT gvu.*,
               u.nombre AS nombreUsuario,
               u.email,
               gv.nombreGrupoVoluntariado,
               c.nombreCargo
        FROM GrupoVoluntariado_Usuario gvu
        INNER JOIN usuario u ON gvu.idUsuario = u.idUsuario
        INNER JOIN GrupoVoluntariado gv ON gvu.idGrupoVoluntariado = gv.idGrupoVoluntariado
        INNER JOIN Cargo c ON gvu.idCargo = c.idCargo;

    -- RESTORE ----------------------------------------------------------------
    ELSEIF p_Accion = 'RESTORE' THEN
        IF p_idGrupoVoluntariado IS NULL OR p_idUsuario IS NULL THEN
            SELECT 'Error: Se requiere idGrupoVoluntariado e idUsuario para restaurar' AS Mensaje;
        ELSE
            UPDATE GrupoVoluntariado_Usuario
            SET activo = TRUE
            WHERE idGrupoVoluntariado = p_idGrupoVoluntariado 
                AND idUsuario = p_idUsuario 
                AND activo = FALSE;
            
            IF ROW_COUNT() > 0 THEN
                SELECT p_idGrupoVoluntariado AS idGrupoVoluntariado,
                       p_idUsuario AS idUsuario,
                       'Inscripción restaurada correctamente' AS Mensaje;
            ELSE
                SELECT 'Error: Inscripción no encontrada o ya está activa' AS Mensaje;
            END IF;
        END IF;

    ELSE
        SELECT 'Error: Acción no válida. Use INSERT, UPDATE, DELETE, SELECT, SELECTALL o RESTORE' AS Mensaje;
    END IF;

    COMMIT;
END
