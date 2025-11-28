-- crear tabla Actividad
CREATE TABLE Actividad (
    idActi INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT NOT NULL,
    fecha DATE NOT NULL,
    duracionhoras INT NOT NULL,
    activo BOOLEAN DEFAULT TRUE COMMENT 'TRUE = activo, FALSE = eliminado lógicamente'
);

-- CRUD actividades 
CREATE PROCEDURE sp_Actividad_CRUD(
    IN p_Accion VARCHAR(10),
    IN p_idActi INT,
    IN p_nombre VARCHAR(200),
    IN p_descripcion TEXT,
    IN p_fecha DATE,
    IN p_duracionhoras INT
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
        INSERT INTO Actividad (nombre, descripcion, fecha, duracionhoras, activo)
        VALUES (p_nombre, p_descripcion, p_fecha, p_duracionhoras, TRUE);
        
        SELECT LAST_INSERT_ID() AS idActi, 'Actividad insertada correctamente' AS Mensaje;

    ELSEIF p_Accion = 'UPDATE' THEN
        IF p_idActi IS NULL THEN
            SELECT 'Error: Se requiere idActi para actualizar' AS Mensaje;
        ELSE
            UPDATE Actividad
            SET nombre = IFNULL(p_nombre, nombre),
                descripcion = IFNULL(p_descripcion, descripcion),
                fecha = IFNULL(p_fecha, fecha),
                duracionhoras = IFNULL(p_duracionhoras, duracionhoras)
            WHERE idActi = p_idActi AND activo = TRUE;
            
            IF ROW_COUNT() > 0 THEN
                SELECT p_idActi AS idActi, 'Actividad actualizada correctamente' AS Mensaje;
            ELSE
                SELECT 'Error: Actividad no encontrada o ya está eliminada' AS Mensaje;
            END IF;
        END IF;

    ELSEIF p_Accion = 'DELETE' THEN
        IF p_idActi IS NULL THEN
            SELECT 'Error: Se requiere idActi para eliminar' AS Mensaje;
        ELSE
            -- Delete lógico: marcar como inactivo
            UPDATE Actividad 
            SET activo = FALSE
            WHERE idActi = p_idActi AND activo = TRUE;
            
            IF ROW_COUNT() > 0 THEN
                SELECT p_idActi AS idActi, 'Actividad eliminada lógicamente' AS Mensaje;
            ELSE
                SELECT 'Error: Actividad no encontrada o ya está eliminada' AS Mensaje;
            END IF;
        END IF;

    ELSEIF p_Accion = 'SELECT' THEN
        IF p_idActi IS NOT NULL THEN
            -- Seleccionar una actividad específica (solo activas)
            SELECT * FROM Actividad WHERE idActi = p_idActi AND activo = TRUE;
        ELSEIF p_nombre IS NOT NULL THEN
            -- Buscar por nombre (solo activas)
            SELECT * FROM Actividad WHERE nombre LIKE CONCAT('%', p_nombre, '%') AND activo = TRUE;
        ELSEIF p_fecha IS NOT NULL THEN
            -- Buscar por fecha (solo activas)
            SELECT * FROM Actividad WHERE fecha = p_fecha AND activo = TRUE;
        ELSE
            -- Seleccionar todas las actividades activas
            SELECT * FROM Actividad WHERE activo = TRUE;
        END IF;

    ELSEIF p_Accion = 'SELECTALL' THEN
        -- Seleccionar TODAS las actividades (incluyendo eliminadas)
        SELECT * FROM Actividad;

    ELSEIF p_Accion = 'RESTORE' THEN
        -- Restaurar una actividad eliminada lógicamente
        IF p_idActi IS NULL THEN
            SELECT 'Error: Se requiere idActi para restaurar' AS Mensaje;
        ELSE
            UPDATE Actividad 
            SET activo = TRUE
            WHERE idActi = p_idActi AND activo = FALSE;
            
            IF ROW_COUNT() > 0 THEN
                SELECT p_idActi AS idActi, 'Actividad restaurada correctamente' AS Mensaje;
            ELSE
                SELECT 'Error: Actividad no encontrada o ya está activa' AS Mensaje;
            END IF;
        END IF;

    ELSE
        SELECT 'Error: Acción no válida. Use INSERT, UPDATE, DELETE, SELECT, SELECTALL o RESTORE' AS Mensaje;
    END IF;

    COMMIT;
END;