import pool from '../config/database.js';

const formatDateForMySQL = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toISOString().slice(0, 19).replace('T', ' ');
};

// Obtener todas las actividades o una específica
export const obtenerTodasActividades = async (req, res) => {
    try {
        const { id } = req.params;

        const accion = 'SELECTALL';
        const idActividad = id ? parseInt(id) : null;

        const [result] = await pool.query(
            'CALL sp_Actividad_CRUD(?, ?, NULL, NULL, NULL, NULL, NULL)',
            [accion, idActividad]
        );

        const actividades = result[0];

        res.status(200).json({
            ok: true,
            actividades: actividades
        });

    } catch (error) {
        console.error('Error al obtener actividades:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener actividades',
            error: error.message
        });
    }
};

// Obtener actividad por ID
export const obtenerActividadPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const idActividad = parseInt(id);

        const [result] = await pool.query(
            'CALL sp_Actividad_CRUD(?, ?, NULL, NULL, NULL, NULL, NULL)',
            ['SELECT', idActividad]
        );

        if (result[0] && result[0].length > 0) {
            res.status(200).json({
                ok: true,
                actividad: result[0][0]
            });
        } else {
            res.status(404).json({
                ok: false,
                msg: 'Actividad no encontrada'
            });
        }

    } catch (error) {
        console.error('Error al obtener actividad:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener actividad',
            error: error.message
        });
    }
};

// Obtener actividades por grupo
export const obtenerActividadesPorGrupo = async (req, res) => {
    try {
        const { idGrupo } = req.params;

        const [result] = await pool.query(
            'CALL sp_Actividad_CRUD(?, NULL, ?, NULL, NULL, NULL, NULL)',
            ['SELECT', parseInt(idGrupo)]
        );

        res.status(200).json({
            ok: true,
            actividades: result[0]
        });

    } catch (error) {
        console.error('Error al obtener actividades del grupo:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener actividades del grupo',
            error: error.message
        });
    }
};


// Crear una nueva actividad
export const crearActividad = async (req, res) => {
    try {
        const {
            idGrupoVoluntariado,
            nombre,
            descripcion,
            fecha,
            duracionhoras,
        } = req.body;

        // Validaciones básicas
        if (!idGrupoVoluntariado || !nombre || !descripcion || !fecha || !duracionhoras) {
            return res.status(400).json({
                ok: false,
                msg: 'Todos los campos obligatorios deben ser completados (incluido idGrupoVoluntariado)'
            });
        }

        const [result] = await pool.query(
            'CALL sp_Actividad_CRUD(?, NULL, ?, ?, ?, ?, ?)',
            [
                'INSERT',
                parseInt(idGrupoVoluntariado),
                nombre,
                descripcion,
                formatDateForMySQL(fecha),
                duracionhoras,
            ]
        );

        const respuesta = result[0][0];

        res.status(201).json({
            ok: true,
            msg: respuesta.Mensaje,
            idActividad: respuesta.idActi
        });

    } catch (error) {
        console.error('Error al crear actividad:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                ok: false,
                msg: 'La actividad ya está registrada'
            });
        }
        res.status(500).json({
            ok: false,
            msg: 'Error al crear Actividad',
            error: error.message
        });
    }
};

// Actualizar actividad
export const actualizarActividad = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            idGrupoVoluntariado,
            nombre,
            descripcion,
            fecha,
            duracionhoras,
        } = req.body;

        const [result] = await pool.query(
            'CALL sp_Actividad_CRUD(?, ?, ?, ?, ?, ?, ?)',
            [
                'UPDATE',
                parseInt(id),
                idGrupoVoluntariado ? parseInt(idGrupoVoluntariado) : null,
                nombre || null,
                descripcion || null,
                fecha ? formatDateForMySQL(fecha) : null,
                duracionhoras || null
            ]
        );

        if (result[0] && result[0].length > 0) {
            const respuesta = result[0][0];
            res.status(200).json({
                ok: true,
                msg: respuesta.Mensaje,
                idActividad: respuesta.idActi
            });
        } else {
            res.status(404).json({
                ok: false,
                msg: 'Actividad no encontrada'
            });
        }

    } catch (error) {
        console.error('Error al actualizar actividad:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al actualizar actividad',
            error: error.message
        });
    }
};

// Eliminar actividad
export const eliminarActividad = async (req, res) => {
    try {
        const { id } = req.params;

        // Primero verificamos el estado
        const [check] = await pool.query(
            'CALL sp_Actividad_CRUD(?, ?, NULL, NULL, NULL, NULL, NULL)',
            ['SELECT', parseInt(id)]
        );

        if (!check[0] || check[0].length === 0) {
            return res.status(404).json({
                ok: false,
                msg: 'Actividad no encontrada'
            });
        }

        const actividad = check[0][0];

        if (actividad.activo === 1) {
            // Desactivar
            const [result] = await pool.query(
                'CALL sp_Actividad_CRUD(?, ?, NULL, NULL, NULL, NULL, NULL)',
                ['DELETE', parseInt(id)]
            );
            res.status(200).json({ ok: true, msg: result[0][0].Mensaje });
        } else {
            // Restaurar
            const [result] = await pool.query(
                'CALL sp_Actividad_CRUD(?, ?, NULL, NULL, NULL, NULL, NULL)',
                ['RESTORE', parseInt(id)]
            );
            res.status(200).json({ ok: true, msg: result[0][0].Mensaje });
        }

    } catch (error) {
        console.error('Error al eliminar/restaurar actividad:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al procesar la solicitud',
            error: error.message
        });
    }
};
