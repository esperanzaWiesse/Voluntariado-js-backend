import pool from '../config/database.js';

// Registrar participación de un usuario en una actividad
export const registrarParticipacion = async (req, res) => {
    try {
        const { idActividad, idUsuario, horasRealizadas, completado } = req.body;

        if (!idActividad || !idUsuario) {
            return res.status(400).json({
                ok: false,
                msg: 'Se requiere idActividad e idUsuario'
            });
        }

        const [result] = await pool.query(
            'CALL sp_Actividad_Usuario_CRUD(?, ?, ?, ?, ?)',
            [
                'INSERT',
                parseInt(idActividad),
                parseInt(idUsuario),
                horasRealizadas || 0,
                completado ? 1 : 0
            ]
        );

        const respuesta = result[0][0];

        res.status(201).json({
            ok: true,
            msg: respuesta.Mensaje,
            datos: {
                idActividad: respuesta.idActividad,
                idUsuario: respuesta.idUsuario
            }
        });

    } catch (error) {
        console.error('Error al registrar participación:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                ok: false,
                msg: 'El usuario ya está registrado en esta actividad'
            });
        }
        res.status(500).json({
            ok: false,
            msg: 'Error al registrar participación',
            error: error.message
        });
    }
};

// Actualizar participación (horas o estado)
export const actualizarParticipacion = async (req, res) => {
    try {
        const { idActividad, idUsuario } = req.params;
        const { horasRealizadas, completado } = req.body;

        const [result] = await pool.query(
            'CALL sp_Actividad_Usuario_CRUD(?, ?, ?, ?, ?)',
            [
                'UPDATE',
                parseInt(idActividad),
                parseInt(idUsuario),
                horasRealizadas !== undefined ? horasRealizadas : null,
                completado !== undefined ? (completado ? 1 : 0) : null
            ]
        );

        if (result[0] && result[0].length > 0) {
            const respuesta = result[0][0];
            res.status(200).json({
                ok: true,
                msg: respuesta.Mensaje
            });
        } else {
            res.status(404).json({
                ok: false,
                msg: 'Participación no encontrada'
            });
        }

    } catch (error) {
        console.error('Error al actualizar participación:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al actualizar participación',
            error: error.message
        });
    }
};

// Eliminar/Restaurar participación en actividad
export const eliminarParticipacion = async (req, res) => {
    try {
        const { idActividad, idUsuario } = req.params;
        const accion = 'SELECT';
        const idAct = idActividad ? parseInt(idActividad) : null;
        const idUsu = idUsuario ? parseInt(idUsuario) : null;

        // Validar que los IDs sean válidos
        if (!idAct || !idUsu) {
            return res.status(400).json({
                ok: false,
                msg: 'Los parámetros idActividad e idUsuario son requeridos'
            });
        }

        // Obtener el estado actual de la participación
        const [result] = await pool.query(
            'CALL sp_Actividad_Usuario_CRUD(?, ?, ?, NULL, NULL)',
            [accion, idAct, idUsu, null, null]
        );

        const participaciones = result[0];

        // Verificar si existe la participación
        if (!participaciones || participaciones.length === 0) {
            return res.status(404).json({
                ok: false,
                msg: 'No se encontró la participación del usuario en la actividad'
            });
        }

        // Si existe, y estamos aquí, lo borramos (hard delete o logico segun lo que pide el usuario, 
        // pero el SP original hace DELETE fisico si es DELETE.
        // Pero el usuario pidió implementar logica similar a activdad.
        // Re-leyendo el SP sp_Actividad_Usuario_CRUD:
        // DELETE hace DELETE FROM. No tiene campo activo.
        // Entonces solo llamamos DELETE y ya.

        const [deleteResult] = await pool.query(
            'CALL sp_Actividad_Usuario_CRUD(?, ?, ?, NULL, NULL)',
            ['DELETE', idAct, idUsu, null, null]
        );

        const respuesta = deleteResult[0][0];

        res.status(200).json({
            ok: true,
            msg: respuesta.Mensaje
        });

    } catch (error) {
        console.error('Error al eliminar participación:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al eliminar participación',
            error: error.message
        });
    }
};

// Obtener participantes de una actividad
export const obtenerParticipantesActividad = async (req, res) => {
    try {
        const { idActividad } = req.params;

        const [result] = await pool.query(
            'CALL sp_Actividad_Usuario_CRUD(?, ?, NULL, NULL, NULL)',
            ['SELECT', parseInt(idActividad)]
        );

        res.status(200).json({
            ok: true,
            participantes: result[0]
        });

    } catch (error) {
        console.error('Error al obtener participantes:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener participantes',
            error: error.message
        });
    }
};

// Obtener actividades de un usuario
export const obtenerActividadesUsuario = async (req, res) => {
    try {
        const { idUsuario } = req.params;

        const [result] = await pool.query(
            'CALL sp_Actividad_Usuario_CRUD(?, NULL, ?, NULL, NULL)',
            ['SELECT', parseInt(idUsuario)]
        );

        res.status(200).json({
            ok: true,
            actividades: result[0]
        });

    } catch (error) {
        console.error('Error al obtener actividades del usuario:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener actividades del usuario',
            error: error.message
        });
    }
};

// ============================================================================
// REPORTE DE PARTICIPACIÓN Y BENEFICIOS
// ============================================================================
export const obtenerReporteParticipacion = async (req, res) => {
    try {
        const { idUsuario } = req.params;

        // 1. Obtener todas las actividades completadas por el usuario con detalles del grupo
        const query = `
            SELECT 
                au.idActividad,
                au.horasRealizadas,
                au.fechaCompletado,
                a.nombre AS nombreActividad,
                a.duracionhoras,
                gv.idGrupoVoluntariado,
                gv.nombreGrupoVoluntariado
            FROM Actividad_Usuario au
            INNER JOIN Actividad a ON au.idActividad = a.idActi
            INNER JOIN GrupoVoluntariado gv ON a.idGrupoVoluntariado = gv.idGrupoVoluntariado
            WHERE au.idUsuario = ? 
              AND au.completado = 1
              AND a.activo = 1
              AND gv.activo = 1
            ORDER BY gv.nombreGrupoVoluntariado, a.fecha DESC
        `;

        const [rows] = await pool.query(query, [parseInt(idUsuario)]);

        // 2. Procesar los datos
        let totalHorasGlobal = 0;
        const gruposMap = new Map();

        rows.forEach(row => {
            const horas = parseFloat(row.horasRealizadas);
            totalHorasGlobal += horas;

            if (!gruposMap.has(row.idGrupoVoluntariado)) {
                gruposMap.set(row.idGrupoVoluntariado, {
                    idGrupoVoluntariado: row.idGrupoVoluntariado,
                    nombreGrupo: row.nombreGrupoVoluntariado,
                    totalHorasGrupo: 0,
                    actividades: []
                });
            }

            const grupo = gruposMap.get(row.idGrupoVoluntariado);
            grupo.totalHorasGrupo += horas;
            grupo.actividades.push({
                nombre: row.nombreActividad,
                horas: horas,
                fecha: row.fechaCompletado
            });
        });

        // 3. Determinar beneficio
        let beneficio = "Ninguno";

        if (totalHorasGlobal > 100) {
            beneficio = "Certificado";
        } else if (totalHorasGlobal >= 51) {
            beneficio = "Opción a elegir: Bono o Crédito";
        } else if (totalHorasGlobal >= 25) {
            beneficio = "Bono Académico";
        } else {
            beneficio = `Faltan ${25 - totalHorasGlobal} horas para el primer beneficio`;
        }

        // 4. Responder
        res.status(200).json({
            ok: true,
            idUsuario: parseInt(idUsuario),
            totalHorasAcumuladas: totalHorasGlobal,
            beneficioCorrespondiente: beneficio,
            detallePorGrupo: Array.from(gruposMap.values())
        });

    } catch (error) {
        console.error('Error al generar reporte de participación:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al generar reporte',
            error: error.message
        });
    }
};