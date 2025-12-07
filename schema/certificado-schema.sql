-- Crear tabla de certificados
CREATE TABLE Certificado (
    idCertificado INT PRIMARY KEY AUTO_INCREMENT,
    numeroCertificado VARCHAR(50) UNIQUE NOT NULL,
    idGrupoVoluntariado INT NOT NULL,
    idUsuario INT NOT NULL,
    horasCompletadas DECIMAL(10,2) NOT NULL,
    fechaEmision DATETIME DEFAULT CURRENT_TIMESTAMP,
    activo TINYINT(1) DEFAULT 1,
    FOREIGN KEY (idGrupoVoluntariado) REFERENCES GrupoVoluntariado(idGrupoVoluntariado)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (idUsuario) REFERENCES usuario(idUsuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ============================================================================
-- PROCEDIMIENTO: sp_Actividad_Usuario_CRUD
-- ============================================================================
CREATE PROCEDURE sp_Certificado_CRUD(
    IN p_Accion VARCHAR(10),
    IN p_idCertificado INT,
    IN p_numeroCertificado VARCHAR(50),
    IN p_idGrupoVoluntariado INT,
    IN p_idUsuario INT,
    IN p_horasCompletadas DECIMAL(10,2),
    IN p_fechaEmision DATETIME
)
BEGIN
    DECLARE v_numeroCertificado VARCHAR(50);
    
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
        -- Generar número único de certificado si no se proporciona
        IF p_numeroCertificado IS NULL THEN
            SET v_numeroCertificado = CONCAT(
                'CERT-',
                YEAR(CURRENT_DATE),
                '-',
                LPAD(p_idGrupoVoluntariado, 4, '0'),
                '-',
                LPAD(p_idUsuario, 6, '0'),
                '-',
                LPAD(FLOOR(RAND() * 9999), 4, '0')
            );
        ELSE
            SET v_numeroCertificado = p_numeroCertificado;
        END IF;
        
        INSERT INTO Certificado (
            numeroCertificado, 
            idGrupoVoluntariado, 
            idUsuario, 
            horasCompletadas, 
            fechaEmision, 
            activo
        )
        VALUES (
            v_numeroCertificado,
            p_idGrupoVoluntariado,
            p_idUsuario,
            p_horasCompletadas,
            IFNULL(p_fechaEmision, CURRENT_TIMESTAMP),
            TRUE
        );
        
        SELECT LAST_INSERT_ID() AS idCertificado,
               v_numeroCertificado AS numeroCertificado,
               'Certificado insertado correctamente' AS Mensaje;

    -- ACTUALIZAR -------------------------------------------------------------
    ELSEIF p_Accion = 'UPDATE' THEN
        IF p_idCertificado IS NULL THEN
            SELECT 'Error: Se requiere idCertificado para actualizar' AS Mensaje;
        ELSE
            UPDATE Certificado
            SET numeroCertificado = IFNULL(p_numeroCertificado, numeroCertificado),
                idGrupoVoluntariado = IFNULL(p_idGrupoVoluntariado, idGrupoVoluntariado),
                idUsuario = IFNULL(p_idUsuario, idUsuario),
                horasCompletadas = IFNULL(p_horasCompletadas, horasCompletadas),
                fechaEmision = IFNULL(p_fechaEmision, fechaEmision)
            WHERE idCertificado = p_idCertificado AND activo = TRUE;
            
            IF ROW_COUNT() > 0 THEN
                SELECT p_idCertificado AS idCertificado, 
                       'Certificado actualizado correctamente' AS Mensaje;
            ELSE
                SELECT 'Error: Certificado no encontrado o ya está eliminado' AS Mensaje;
            END IF;
        END IF;

    -- DELETE LÓGICO ----------------------------------------------------------
    ELSEIF p_Accion = 'DELETE' THEN
        IF p_idCertificado IS NULL THEN
            SELECT 'Error: Se requiere idCertificado para eliminar' AS Mensaje;
        ELSE
            UPDATE Certificado
            SET activo = FALSE
            WHERE idCertificado = p_idCertificado AND activo = TRUE;
            
            IF ROW_COUNT() > 0 THEN
                SELECT p_idCertificado AS idCertificado, 
                       'Certificado eliminado lógicamente' AS Mensaje;
            ELSE
                SELECT 'Error: Certificado no encontrado o ya está eliminado' AS Mensaje;
            END IF;
        END IF;

    -- SELECT -----------------------------------------------------------------
    ELSEIF p_Accion = 'SELECT' THEN
        IF p_idCertificado IS NOT NULL THEN
            -- Seleccionar un certificado específico con información completa
            SELECT 
                c.*,
                u.nombre AS nombreUsuario,
                u.apPaterno,
                u.apMaterno,
                u.email,
                gv.nombreGrupoVoluntariado,
                gv.descripcion AS descripcionGrupo
            FROM Certificado c
            INNER JOIN usuario u ON c.idUsuario = u.idUsuario
            INNER JOIN GrupoVoluntariado gv ON c.idGrupoVoluntariado = gv.idGrupoVoluntariado
            WHERE c.idCertificado = p_idCertificado;
            
        -- Buscar por número de certificado
        ELSEIF p_numeroCertificado IS NOT NULL THEN
            SELECT 
                c.*,
                u.nombre AS nombreUsuario,
                u.apPaterno,
                u.apMaterno,
                gv.nombreGrupoVoluntariado
            FROM Certificado c
            INNER JOIN usuario u ON c.idUsuario = u.idUsuario
            INNER JOIN GrupoVoluntariado gv ON c.idGrupoVoluntariado = gv.idGrupoVoluntariado
            WHERE c.numeroCertificado LIKE CONCAT('%', p_numeroCertificado, '%')
                AND c.activo = TRUE;
                
        -- Buscar por usuario
        ELSEIF p_idUsuario IS NOT NULL THEN
            SELECT 
                c.*,
                gv.nombreGrupoVoluntariado,
                gv.descripcion AS descripcionGrupo
            FROM Certificado c
            INNER JOIN GrupoVoluntariado gv ON c.idGrupoVoluntariado = gv.idGrupoVoluntariado
            WHERE c.idUsuario = p_idUsuario
                AND c.activo = TRUE
            ORDER BY c.fechaEmision DESC;
                
        -- Buscar por grupo
        ELSEIF p_idGrupoVoluntariado IS NOT NULL THEN
            SELECT 
                c.*,
                u.nombre AS nombreUsuario,
                u.apPaterno,
                u.apMaterno,
                u.email
            FROM Certificado c
            INNER JOIN usuario u ON c.idUsuario = u.idUsuario
            WHERE c.idGrupoVoluntariado = p_idGrupoVoluntariado
                AND c.activo = TRUE
            ORDER BY c.fechaEmision DESC;
        ELSE
            -- Seleccionar todos los certificados activos
            SELECT 
                c.*,
                u.nombre AS nombreUsuario,
                u.apPaterno,
                u.apMaterno,
                gv.nombreGrupoVoluntariado
            FROM Certificado c
            INNER JOIN usuario u ON c.idUsuario = u.idUsuario
            INNER JOIN GrupoVoluntariado gv ON c.idGrupoVoluntariado = gv.idGrupoVoluntariado
            WHERE c.activo = TRUE
            ORDER BY c.fechaEmision DESC;
        END IF;

    -- SELECT ALL (incluye eliminados) ----------------------------------------
    ELSEIF p_Accion = 'SELECTALL' THEN
        SELECT 
            c.*,
            u.nombre AS nombreUsuario,
            u.apPaterno,
            u.apMaterno,
            gv.nombreGrupoVoluntariado
        FROM Certificado c
        INNER JOIN usuario u ON c.idUsuario = u.idUsuario
        INNER JOIN GrupoVoluntariado gv ON c.idGrupoVoluntariado = gv.idGrupoVoluntariado
        ORDER BY c.fechaEmision DESC;

    -- RESTORE ----------------------------------------------------------------
    ELSEIF p_Accion = 'RESTORE' THEN
        IF p_idCertificado IS NULL THEN
            SELECT 'Error: Se requiere idCertificado para restaurar' AS Mensaje;
        ELSE
            UPDATE Certificado
            SET activo = TRUE
            WHERE idCertificado = p_idCertificado AND activo = FALSE;
            
            IF ROW_COUNT() > 0 THEN
                SELECT p_idCertificado AS idCertificado, 
                       'Certificado restaurado correctamente' AS Mensaje;
            ELSE
                SELECT 'Error: Certificado no encontrado o ya está activo' AS Mensaje;
            END IF;
        END IF;

    -- ACCIÓN INVÁLIDA --------------------------------------------------------
    ELSE
        SELECT 'Error: Acción no válida. Use INSERT, UPDATE, DELETE, SELECT, SELECTALL o RESTORE' AS Mensaje;
    END IF;

    COMMIT;
END


-- ============================================================================
-- PROCEDIMIENTO ADICIONAL: Generar certificados automáticamente
-- ============================================================================

CREATE PROCEDURE sp_GenerarCertificados_GrupoCompleto(
    IN p_idGrupoVoluntariado INT
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_idUsuario INT;
    DECLARE v_horasCompletadas DECIMAL(10,2);
    DECLARE v_horasRequeridas DECIMAL(10,2);
    DECLARE v_numeroCertificado VARCHAR(50);
    
    -- Cursor para recorrer usuarios que completaron las horas
    DECLARE cur_usuarios CURSOR FOR
        SELECT 
            gvu.idUsuario,
            SUM(au.horasRealizadas) AS horasCompletadas,
            gv.duracionHoras AS horasRequeridas
        FROM GrupoVoluntariado_Usuario gvu
        INNER JOIN GrupoVoluntariado gv ON gvu.idGrupoVoluntariado = gv.idGrupoVoluntariado
        LEFT JOIN Actividad a ON a.idGrupoVoluntariado = gv.idGrupoVoluntariado
        LEFT JOIN Actividad_Usuario au ON au.idActividad = a.idActi 
            AND au.idUsuario = gvu.idUsuario 
            AND au.completado = TRUE
        WHERE gvu.idGrupoVoluntariado = p_idGrupoVoluntariado
            AND gvu.activo = TRUE
        GROUP BY gvu.idUsuario, gv.duracionHoras
        HAVING horasCompletadas >= horasRequeridas;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
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
    
    OPEN cur_usuarios;
    
    read_loop: LOOP
        FETCH cur_usuarios INTO v_idUsuario, v_horasCompletadas, v_horasRequeridas;
        
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Verificar si ya existe un certificado para este usuario y grupo
        IF NOT EXISTS (
            SELECT 1 FROM Certificado 
            WHERE idGrupoVoluntariado = p_idGrupoVoluntariado 
                AND idUsuario = v_idUsuario 
                AND activo = TRUE
        ) THEN
            -- Generar número único de certificado
            SET v_numeroCertificado = CONCAT(
                'CERT-',
                YEAR(CURRENT_DATE),
                '-',
                LPAD(p_idGrupoVoluntariado, 4, '0'),
                '-',
                LPAD(v_idUsuario, 6, '0'),
                '-',
                LPAD(FLOOR(RAND() * 9999), 4, '0')
            );
            
            -- Insertar certificado
            INSERT INTO Certificado (
                numeroCertificado,
                idGrupoVoluntariado,
                idUsuario,
                horasCompletadas,
                fechaEmision,
                activo
            )
            VALUES (
                v_numeroCertificado,
                p_idGrupoVoluntariado,
                v_idUsuario,
                v_horasCompletadas,
                CURRENT_TIMESTAMP,
                TRUE
            );
        END IF;
    END LOOP;
    
    CLOSE cur_usuarios;
    
    -- Mostrar resumen
    SELECT 
        COUNT(*) AS certificadosGenerados,
        'Certificados generados exitosamente' AS Mensaje
    FROM Certificado
    WHERE idGrupoVoluntariado = p_idGrupoVoluntariado
        AND DATE(fechaEmision) = CURRENT_DATE;
    
    COMMIT;
END
