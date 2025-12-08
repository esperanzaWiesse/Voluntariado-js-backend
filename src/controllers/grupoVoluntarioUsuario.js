import pool from '../config/database.js';

// Inscribir usuario en grupo
export const inscribirUsuario = async (req, res) => {
    try {
        const { idGrupoVoluntariado, idUsuario, idCargo } = req.body;

        if (!idGrupoVoluntariado || !idUsuario || !idCargo) {
            return res.status(400).json({
                ok: false,
                msg: 'Se requiere idGrupoVoluntariado, idUsuario e idCargo'
            });
        }

        const [result] = await pool.query(
            'CALL sp_GrupoVoluntariado_Usuario_CRUD(?, ?, ?, ?, NULL)',
            [
                'INSERT',
                parseInt(idGrupoVoluntariado),
                parseInt(idUsuario),
                parseInt(idCargo)
            ]
        );

        // El SP devuelve un mensaje o un error
        // Si hay error en SP (como limite miembros) el pool.query podria lanzar error o devolver result vacio dependiendo driver
        // Pero segun SP usa SELECT 'Error...' AS Mensaje y ROLLBACK.
        // Mysql driver con multiple statements o procedures devuelven array de resultados.

        const respuesta = result[0][0];

        if (respuesta && respuesta.Mensaje && respuesta.Mensaje.startsWith('Error')) {
            return res.status(400).json({
                ok: false,
                msg: respuesta.Mensaje
            });
        }

        res.status(201).json({
            ok: true,
            msg: respuesta.Mensaje,
            datos: {
                idGrupoVoluntariado: respuesta.idGrupoVoluntariado,
                idUsuario: respuesta.idUsuario
            }
        });

    } catch (error) {
        console.error('Error al inscribir usuario:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                ok: false,
                msg: 'El usuario ya está inscrito en este grupo'
            });
        }
        res.status(500).json({
            ok: false,
            msg: 'Error al inscribir usuario',
            error: error.message
        });
    }
};

// Actualizar cargo de usuario en grupo
export const actualizarCargo = async (req, res) => {
    try {
        const { idGrupo, idUsuario } = req.params;
        const { idCargo } = req.body;

        if (!idCargo) {
            return res.status(400).json({
                ok: false,
                msg: 'Se requiere idCargo para actualizar'
            });
        }

        const [result] = await pool.query(
            'CALL sp_GrupoVoluntariado_Usuario_CRUD(?, ?, ?, ?, NULL)',
            [
                'UPDATE',
                parseInt(idGrupo),
                parseInt(idUsuario),
                parseInt(idCargo)
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
                msg: 'Inscripción no encontrada'
            });
        }

    } catch (error) {
        console.error('Error al actualizar cargo:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al actualizar cargo',
            error: error.message
        });
    }
};

// Dar de baja o restaurar usuario en grupo
export const gestionarEstadoInscripcion = async (req, res) => {
    try {
        const { idGrupo, idUsuario } = req.params;

        // Verificar estado actual primero
        const [check] = await pool.query(
            'CALL sp_GrupoVoluntariado_Usuario_CRUD(?, ?, ?, NULL, NULL)',
            ['SELECT', parseInt(idGrupo), parseInt(idUsuario), null]
        );

        if (!check[0] || check[0].length === 0) {
            return res.status(404).json({
                ok: false,
                msg: 'Inscripción no encontrada'
            });
        }

        const inscripcion = check[0][0];

        if (inscripcion.activo === 1) {
            // Dar de baja (DELETE logico)
            const [result] = await pool.query(
                'CALL sp_GrupoVoluntariado_Usuario_CRUD(?, ?, ?, NULL, NULL)',
                ['DELETE', parseInt(idGrupo), parseInt(idUsuario), null]
            );
            res.status(200).json({ ok: true, msg: result[0][0].Mensaje });
        } else {
            // Restaurar
            const [result] = await pool.query(
                'CALL sp_GrupoVoluntariado_Usuario_CRUD(?, ?, ?, NULL, NULL)',
                ['RESTORE', parseInt(idGrupo), parseInt(idUsuario), null]
            );
            res.status(200).json({ ok: true, msg: result[0][0].Mensaje });
        }

    } catch (error) {
        console.error('Error al cambiar estado de inscripción:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al cambiar estado',
            error: error.message
        });
    }
};

// Obtener miembros de un grupo
export const obtenerMiembrosGrupo = async (req, res) => {
    try {
        const { idGrupo } = req.params;

        const [result] = await pool.query(
            'CALL sp_GrupoVoluntariado_Usuario_CRUD(?, ?, NULL, NULL, NULL)',
            ['SELECT', parseInt(idGrupo)]
        );

        res.status(200).json({
            ok: true,
            miembros: result[0]
        });

    } catch (error) {
        console.error('Error al obtener miembros:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener miembros',
            error: error.message
        });
    }
};

// Obtener grupos de un usuario
export const obtenerGruposUsuario = async (req, res) => {
    try {
        const { idUsuario } = req.params;

        const [result] = await pool.query(
            'CALL sp_GrupoVoluntariado_Usuario_CRUD(?, NULL, ?, NULL, NULL)',
            ['SELECT', parseInt(idUsuario)]
        );

        res.status(200).json({
            ok: true,
            grupos: result[0]
        });

    } catch (error) {
        console.error('Error al obtener grupos del usuario:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener grupos del usuario',
            error: error.message
        });
    }
};
