-- Crear tabla para seguimiento de actividades por usuario
CREATE TABLE Actividad_Usuario (
    idActividad INT NOT NULL,
    idUsuario INT NOT NULL,
    fechaCompletado DATETIME DEFAULT CURRENT_TIMESTAMP,
    horasRealizadas DECIMAL(10,2) DEFAULT 0,
    completado TINYINT(1) DEFAULT 0,
    PRIMARY KEY (idActividad, idUsuario),
    FOREIGN KEY (idActividad) REFERENCES Actividad(idActi)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (idUsuario) REFERENCES usuario(idUsuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ============================================================================
-- PROCEDIMIENTO: sp_Actividad_Usuario_CRUD
-- ============================================================================
CREATE PROCEDURE sp_Actividad_Usuario_CRUD(
    IN p_Accion VARCHAR(10),
    IN p_idActividad INT,
    IN p_idUsuario INT,
    IN p_horasRealizadas DECIMAL(10,2),
    IN p_completado TINYINT(1)
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

    -- INSERTAR (Registrar actividad para usuario) ---------------------------
    IF p_Accion = 'INSERT' THEN
        INSERT INTO Actividad_Usuario (
            idActividad,
            idUsuario,
            fechaCompletado,
            horasRealizadas,
            completado
        )
        VALUES (
            p_idActividad,
            p_idUsuario,
            CURRENT_TIMESTAMP,
            IFNULL(p_horasRealizadas, 0),
            IFNULL(p_completado, FALSE)
        );
        
        SELECT p_idActividad AS idActividad,
               p_idUsuario AS idUsuario,
               'Actividad registrada para el usuario' AS Mensaje;

    -- ACTUALIZAR (Marcar actividad como completada o actualizar horas) ------
    ELSEIF p_Accion = 'UPDATE' THEN
        IF p_idActividad IS NULL OR p_idUsuario IS NULL THEN
            SELECT 'Error: Se requiere idActividad e idUsuario para actualizar' AS Mensaje;
        ELSE
            UPDATE Actividad_Usuario
            SET horasRealizadas = IFNULL(p_horasRealizadas, horasRealizadas),
                completado = IFNULL(p_completado, completado),
                fechaCompletado = IF(p_completado = TRUE, CURRENT_TIMESTAMP, fechaCompletado)
            WHERE idActividad = p_idActividad 
                AND idUsuario = p_idUsuario;
            
            IF ROW_COUNT() > 0 THEN
                SELECT p_idActividad AS idActividad,
                       p_idUsuario AS idUsuario,
                       'Actividad actualizada correctamente' AS Mensaje;
            ELSE
                SELECT 'Error: Registro no encontrado' AS Mensaje;
            END IF;
        END IF;

    -- DELETE -----------------------------------------------------------------
    ELSEIF p_Accion = 'DELETE' THEN
        IF p_idActividad IS NULL OR p_idUsuario IS NULL THEN
            SELECT 'Error: Se requiere idActividad e idUsuario para eliminar' AS Mensaje;
        ELSE
            DELETE FROM Actividad_Usuario
            WHERE idActividad = p_idActividad 
                AND idUsuario = p_idUsuario;
            
            IF ROW_COUNT() > 0 THEN
                SELECT p_idActividad AS idActividad,
                       p_idUsuario AS idUsuario,
                       'Registro eliminado correctamente' AS Mensaje;
            ELSE
                SELECT 'Error: Registro no encontrado' AS Mensaje;
            END IF;
        END IF;

    -- SELECT -----------------------------------------------------------------
    ELSEIF p_Accion = 'SELECT' THEN
        IF p_idActividad IS NOT NULL AND p_idUsuario IS NOT NULL THEN
            SELECT au.*,
                   a.nombre AS nombreActividad,
                   a.descripcion,
                   u.nombre AS nombreUsuario
            FROM Actividad_Usuario au
            INNER JOIN Actividad a ON au.idActividad = a.idActi
            INNER JOIN usuario u ON au.idUsuario = u.idUsuario
            WHERE au.idActividad = p_idActividad 
                AND au.idUsuario = p_idUsuario;
                
        ELSEIF p_idActividad IS NOT NULL THEN
            SELECT au.*,
                   u.nombre AS nombreUsuario,
                   u.apPaterno,
                   u.apMaterno
            FROM Actividad_Usuario au
            INNER JOIN usuario u ON au.idUsuario = u.idUsuario
            WHERE au.idActividad = p_idActividad;
            
        ELSEIF p_idUsuario IS NOT NULL THEN
            SELECT au.*,
                   a.nombre AS nombreActividad,
                   a.descripcion,
                   a.duracionhoras
            FROM Actividad_Usuario au
            INNER JOIN Actividad a ON au.idActividad = a.idActi
            WHERE au.idUsuario = p_idUsuario;
        ELSE
            SELECT au.*,
                   a.nombre AS nombreActividad,
                   u.nombre AS nombreUsuario
            FROM Actividad_Usuario au
            INNER JOIN Actividad a ON au.idActividad = a.idActi
            INNER JOIN usuario u ON au.idUsuario = u.idUsuario;
        END IF;

    -- SELECT ALL -------------------------------------------------------------
    ELSEIF p_Accion = 'SELECTALL' THEN
        SELECT au.*,
               a.nombre AS nombreActividad,
               u.nombre AS nombreUsuario,
               gv.nombreGrupoVoluntariado
        FROM Actividad_Usuario au
        INNER JOIN Actividad a ON au.idActividad = a.idActi
        INNER JOIN usuario u ON au.idUsuario = u.idUsuario
        INNER JOIN GrupoVoluntariado gv ON a.idGrupoVoluntariado = gv.idGrupoVoluntariado;

    ELSE
        SELECT 'Error: Acción no válida. Use INSERT, UPDATE, DELETE, SELECT o SELECTALL' AS Mensaje;
    END IF;

    COMMIT;
END