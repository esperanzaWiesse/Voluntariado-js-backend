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

// Eliminar participación
export const eliminarParticipacion = async (req, res) => {
    try {
        const { idActividad, idUsuario } = req.params;

        const [result] = await pool.query(
            'CALL sp_Actividad_Usuario_CRUD(?, ?, ?, ?, ?)',
            [
                'DELETE',
                parseInt(idActividad),
                parseInt(idUsuario),
                null,
                null
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
