-- crear tabla GrupoVoluntariado
CREATE TABLE GrupoVoluntariado (
    idGrupoVoluntariado INT PRIMARY KEY AUTO_INCREMENT,
    nombreGrupoVoluntariado VARCHAR(150) NOT NULL,
    fechaCreacionGrupoVoluntariado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE COMMENT 'TRUE = activo, FALSE = eliminado lógicamente'
);

-- CRUD grupoVoluntariado
CREATE PROCEDURE sp_GrupoVoluntariado_CRUD(
    IN p_Accion VARCHAR(10),
    IN p_idGrupoVoluntariado INT,
    IN p_nombreGrupoVoluntariado VARCHAR(150),
    IN p_fechaCreacionGrupoVoluntariado DATE
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
        INSERT INTO GrupoVoluntariado (nombreGrupoVoluntariado, fechaCreacionGrupoVoluntariado, activo)
        VALUES (p_nombreGrupoVoluntariado, IFNULL(p_fechaCreacionGrupoVoluntariado, CURRENT_DATE), TRUE);
        
        SELECT LAST_INSERT_ID() AS idGrupoVoluntariado, 'Grupo de voluntariado insertado correctamente' AS Mensaje;

    ELSEIF p_Accion = 'UPDATE' THEN
        IF p_idGrupoVoluntariado IS NULL THEN
            SELECT 'Error: Se requiere idGrupoVoluntariado para actualizar' AS Mensaje;
        ELSE
            UPDATE GrupoVoluntariado
            SET nombreGrupoVoluntariado = IFNULL(p_nombreGrupoVoluntariado, nombreGrupoVoluntariado),
                fechaCreacionGrupoVoluntariado = IFNULL(p_fechaCreacionGrupoVoluntariado, fechaCreacionGrupoVoluntariado)
            WHERE idGrupoVoluntariado = p_idGrupoVoluntariado AND activo = TRUE;
            
            IF ROW_COUNT() > 0 THEN
                SELECT p_idGrupoVoluntariado AS idGrupoVoluntariado, 'Grupo de voluntariado actualizado correctamente' AS Mensaje;
            ELSE
                SELECT 'Error: Grupo de voluntariado no encontrado o ya está eliminado' AS Mensaje;
            END IF;
        END IF;

    ELSEIF p_Accion = 'DELETE' THEN
        IF p_idGrupoVoluntariado IS NULL THEN
            SELECT 'Error: Se requiere idGrupoVoluntariado para eliminar' AS Mensaje;
        ELSE
            -- Delete lógico: marcar como inactivo
            UPDATE GrupoVoluntariado 
            SET activo = FALSE
            WHERE idGrupoVoluntariado = p_idGrupoVoluntariado AND activo = TRUE;
            
            IF ROW_COUNT() > 0 THEN
                SELECT p_idGrupoVoluntariado AS idGrupoVoluntariado, 'Grupo de voluntariado eliminado lógicamente' AS Mensaje;
            ELSE
                SELECT 'Error: Grupo de voluntariado no encontrado o ya está eliminado' AS Mensaje;
            END IF;
        END IF;

    ELSEIF p_Accion = 'SELECT' THEN
        IF p_idGrupoVoluntariado IS NOT NULL THEN
            -- Seleccionar un grupo específico (solo activos)
            SELECT * FROM GrupoVoluntariado WHERE idGrupoVoluntariado = p_idGrupoVoluntariado AND activo = TRUE;
        ELSEIF p_nombreGrupoVoluntariado IS NOT NULL THEN
            -- Buscar por nombre (solo activos)
            SELECT * FROM GrupoVoluntariado WHERE nombreGrupoVoluntariado LIKE CONCAT('%', p_nombreGrupoVoluntariado, '%') AND activo = TRUE;
        ELSEIF p_fechaCreacionGrupoVoluntariado IS NOT NULL THEN
            -- Buscar por fecha de creación (solo activos)
            SELECT * FROM GrupoVoluntariado WHERE fechaCreacionGrupoVoluntariado = p_fechaCreacionGrupoVoluntariado AND activo = TRUE;
        ELSE
            -- Seleccionar todos los grupos activos
            SELECT * FROM GrupoVoluntariado WHERE activo = TRUE;
        END IF;

    ELSEIF p_Accion = 'SELECTALL' THEN
        -- Seleccionar TODOS los grupos (incluyendo eliminados)
        SELECT * FROM GrupoVoluntariado;

    ELSEIF p_Accion = 'RESTORE' THEN
        -- Restaurar un grupo eliminado lógicamente
        IF p_idGrupoVoluntariado IS NULL THEN
            SELECT 'Error: Se requiere idGrupoVoluntariado para restaurar' AS Mensaje;
        ELSE
            UPDATE GrupoVoluntariado 
            SET activo = TRUE
            WHERE idGrupoVoluntariado = p_idGrupoVoluntariado AND activo = FALSE;
            
            IF ROW_COUNT() > 0 THEN
                SELECT p_idGrupoVoluntariado AS idGrupoVoluntariado, 'Grupo de voluntariado restaurado correctamente' AS Mensaje;
            ELSE
                SELECT 'Error: Grupo de voluntariado no encontrado o ya está activo' AS Mensaje;
            END IF;
        END IF;

    ELSE
        SELECT 'Error: Acción no válida. Use INSERT, UPDATE, DELETE, SELECT, SELECTALL o RESTORE' AS Mensaje;
    END IF;

    COMMIT;
END;