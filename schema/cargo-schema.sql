CREATE TABLE Cargo (
    idCargo INT AUTO_INCREMENT PRIMARY KEY,
    nombreCargo VARCHAR(200) NOT NULL,
    descripcion TEXT NOT NULL,
    fechaCreacion DATETIME NOT NULL,
    activo BOOLEAN DEFAULT TRUE COMMENT 'TRUE = activo, FALSE = eliminado lógicamente'
);

-- ============================================================================
-- PROCEDIMIENTO: sp_Cargo_CRUD
-- ============================================================================

CREATE PROCEDURE sp_Cargo_CRUD(
    IN p_Accion VARCHAR(10),
    IN p_idCargo INT,
    IN p_nombreCargo VARCHAR(200),
    IN p_descripcion TEXT,
    IN p_fechaCreacion DATETIME
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
        INSERT INTO Cargo (nombreCargo, descripcion, fechaCreacion, activo)
        VALUES (p_nombreCargo, p_descripcion, 
                IFNULL(p_fechaCreacion, CURRENT_TIMESTAMP), TRUE);

        SELECT LAST_INSERT_ID() AS idCargo, 
               'Cargo insertado correctamente' AS Mensaje;

    -- ACTUALIZAR -------------------------------------------------------------
    ELSEIF p_Accion = 'UPDATE' THEN
        IF p_idCargo IS NULL THEN
            SELECT 'Error: Se requiere idCargo para actualizar' AS Mensaje;
        ELSE
            UPDATE Cargo
            SET nombreCargo = IFNULL(p_nombreCargo, nombreCargo),
                descripcion = IFNULL(p_descripcion, descripcion)
            WHERE idCargo = p_idCargo AND activo = TRUE;

            IF ROW_COUNT() > 0 THEN
                SELECT p_idCargo AS idCargo, 
                       'Cargo actualizado correctamente' AS Mensaje;
            ELSE
                SELECT 'Error: Cargo no encontrado o ya está eliminado' AS Mensaje;
            END IF;
        END IF;

    -- DELETE LÓGICO ----------------------------------------------------------
    ELSEIF p_Accion = 'DELETE' THEN
        IF p_idCargo IS NULL THEN
            SELECT 'Error: Se requiere idCargo para eliminar' AS Mensaje;
        ELSE
            UPDATE Cargo
            SET activo = FALSE
            WHERE idCargo = p_idCargo AND activo = TRUE;

            IF ROW_COUNT() > 0 THEN
                SELECT p_idCargo AS idCargo, 
                       'Cargo eliminado lógicamente' AS Mensaje;
            ELSE
                SELECT 'Error: Cargo no encontrado o ya está eliminado' AS Mensaje;
            END IF;
        END IF;

    -- SELECT -----------------------------------------------------------------
    ELSEIF p_Accion = 'SELECT' THEN
        IF p_idCargo IS NOT NULL THEN
         -- Seleccionar un cargo específico
            SELECT * FROM Cargo WHERE idCargo = p_idCargo;
         -- Buscar por nombre (solo activas)
        ELSEIF p_nombreCargo IS NOT NULL THEN
            SELECT * FROM Cargo 
            WHERE nombreCargo LIKE CONCAT('%', p_nombreCargo, '%')
              AND activo = TRUE;

        ELSE
            SELECT * FROM Cargo WHERE activo = TRUE;
        END IF;

    -- SELECT ALL (incluye eliminados) ----------------------------------------
    ELSEIF p_Accion = 'SELECTALL' THEN
        SELECT * FROM Cargo;

    -- RESTORE ----------------------------------------------------------------
    ELSEIF p_Accion = 'RESTORE' THEN
        IF p_idCargo IS NULL THEN
            SELECT 'Error: Se requiere idCargo para restaurar' AS Mensaje;
        ELSE
            UPDATE Cargo
            SET activo = TRUE
            WHERE idCargo = p_idCargo AND activo = FALSE;

            IF ROW_COUNT() > 0 THEN
                SELECT p_idCargo AS idCargo, 
                       'Cargo restaurado correctamente' AS Mensaje;
            ELSE
                SELECT 'Error: Cargo no encontrado o ya está activo' AS Mensaje;
            END IF;
        END IF;

    -- ACCIÓN INVÁLIDA --------------------------------------------------------
    ELSE
        SELECT 'Error: Acción no válida. Use INSERT, UPDATE, DELETE, SELECT, SELECTALL o RESTORE' 
        AS Mensaje;
    END IF;

    COMMIT;
END;
