import pool from '../config/database.js';

// Obtener todos los grupo voluntariado o uno específico
export const obtenerTodosGrupoVoluntario = async (req, res) => {
    try {
        const { id } = req.params;

        const accion = 'SELECTALL';
        const idGrupo = id ? parseInt(id) : null;

        const [result] = await pool.query(
            'CALL sp_GrupoVoluntariado_CRUD(?, ?, NULL, NULL, NULL, NULL, NULL, NULL)',
            [accion, idGrupo]
        );

        if (result[0] && result[0].length > 0) {
            res.status(200).json({
                ok: true,
                grupoVoluntarios: result[0]
            });
        } else {
            res.status(404).json({
                ok: false,
                msg: 'Grupo de voluntariado no encontrado'
            });
        }
    } catch (error) {
        console.error('Error al obtener grupo voluntariado:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener grupo voluntariado',
            error: error.message
        });
    }
};

export const obtenerGrupoVoluntario = async (req, res) => {
    try {
        const { id } = req.params;

        const accion = 'SELECT';
        const idGrupo = id ? parseInt(id) : null;

        const [result] = await pool.query(
            'CALL sp_GrupoVoluntariado_CRUD(?, ?, NULL, NULL, NULL, NULL, NULL, NULL)',
            [accion, idGrupo]
        );

        if (result[0] && result[0].length > 0) {
            res.status(200).json({
                ok: true,
                grupoVoluntario: result[0][0]
            });
        } else {
            res.status(404).json({
                ok: false,
                msg: 'Grupo de voluntariado no encontrado'
            });
        }
    } catch (error) {
        console.error('Error al obtener grupo voluntariado:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener grupo voluntariado',
            error: error.message
        });
    }
};



// Obtener grupo voluntariado por ID
export const obtenerGrupoPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const idGrupo = parseInt(id);

        const accion = 'SELECT';

        const [result] = await pool.query(
            'CALL sp_GrupoVoluntariado_CRUD(?, ?, NULL, NULL, NULL, NULL, NULL, NULL)',
            [accion, idGrupo]
        );

        if (result[0] && result[0].length > 0) {
            res.status(200).json({
                ok: true,
                grupoVoluntario: result[0][0]
            });
        } else {
            res.status(404).json({
                ok: false,
                msg: 'Grupo de voluntariado no encontrado'
            });
        }
    } catch (error) {
        console.error('Error al obtener grupo voluntariado:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener grupo voluntariado',
            error: error.message
        });
    }
};

// Crear un nuevo grupo voluntariado
export const crearGrupoVoluntario = async (req, res) => {
    try {
        const {
            nombreGrupoVoluntariado,
            fechaCreacion,
            duracionHoras,
            duracionDias,
            maxMiembros,
            descripcion
        } = req.body;

        // Validaciones básicas
        if (!nombreGrupoVoluntariado || !duracionHoras || !duracionDias || !descripcion) {
            return res.status(400).json({
                ok: false,
                msg: 'Todos los campos obligatorios deben ser completados'
            });
        }

        const [result] = await pool.query(
            'CALL sp_GrupoVoluntariado_CRUD(?, NULL, ?, ?, ?, ?, ?, ?)',
            [
                'INSERT',
                nombreGrupoVoluntariado,
                fechaCreacion || null,
                duracionHoras,
                duracionDias,
                maxMiembros || null,
                descripcion
            ]
        );

        const respuesta = result[0][0];

        res.status(201).json({
            ok: true,
            msg: respuesta.Mensaje,
            idGrupoVoluntario: respuesta.idGrupoVoluntario
        });

    } catch (error) {
        console.error('Error al crear grupo voluntariado:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al crear grupo voluntariado',
            error: error.message
        });
    }
};

// Actualizar grupo voluntariado
export const actualizarGrupoVoluntario = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nombreGrupoVoluntariado,
            fechaCreacion,
            duracionHoras,
            duracionDias,
            maxMiembros,
            descripcion
        } = req.body;

        const [result] = await pool.query(
            'CALL sp_GrupoVoluntariado_CRUD(?, ?, ?, ?, ?, ?, ?, ?)',
            [
                'UPDATE',
                parseInt(id),
                nombreGrupoVoluntariado || null,
                fechaCreacion || null,
                duracionHoras || null,
                duracionDias || null,
                maxMiembros || null,
                descripcion || null
            ]
        );

        if (result[0] && result[0].length > 0) {
            const respuesta = result[0][0];
            res.status(200).json({
                ok: true,
                msg: respuesta.Mensaje,
                idGrupoVoluntario: respuesta.idGrupoVoluntario
            });
        } else {
            // Caso donde el SP no devuelve nada (e.g. no encontró el registro)
            res.status(404).json({
                ok: false,
                msg: 'Grupo no encontrado o no activo'
            });
        }

    } catch (error) {
        console.error('Error al actualizar grupo voluntariado:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al actualizar grupo voluntariado',
            error: error.message
        });
    }
};

// Eliminar (desactivar) grupo voluntariado
export const eliminarGrupoVoluntario = async (req, res) => {
    // obteniendo el valor del campo activo
    try {
        const { id } = req.params;

        const accion = 'SELECT';
        const idGrupo = id ? parseInt(id) : null;

        const [result] = await pool.query(
            'CALL sp_GrupoVoluntariado_CRUD(?, ?, NULL, NULL, NULL, NULL, NULL, NULL)',
            [accion, idGrupo]
        );

        const grupos = result[0];

        const estadoGrupo = grupos[0].activo;

        // condicion para activar o desactivar
        if (estadoGrupo === 1) {
            // desactivar grupo
            try {
                const { id } = req.params;

                const [result] = await pool.query(
                    'CALL sp_GrupoVoluntariado_CRUD(?, ?, NULL, NULL, NULL, NULL, NULL, NULL)',
                    ['DELETE', parseInt(id)]
                );

                const respuesta = result[0][0];

                res.status(200).json({
                    ok: true,
                    msg: respuesta.Mensaje
                });

            } catch (error) {
                console.error('Error al eliminar grupo:', error);
                res.status(500).json({
                    ok: false,
                    msg: 'Error al eliminar grupo',
                    error: error.message
                });
            }

        } else {
            // activar grupo
            try {
                const { id } = req.params;

                const [result] = await pool.query(
                    'CALL sp_GrupoVoluntariado_CRUD(?, ?, NULL, NULL, NULL, NULL, NULL, NULL)',
                    ['RESTORE', parseInt(id)]
                );

                const respuesta = result[0][0];

                res.status(200).json({
                    ok: true,
                    msg: respuesta.Mensaje
                });

            } catch (error) {
                console.error('Error al activar grupo:', error);
                res.status(500).json({
                    ok: false,
                    msg: 'Error al activar grupo',
                    error: error.message
                });
            }
        }

    } catch (error) {
        console.error('Error al buscar grupo por id:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al buscar grupo',
            error: error.message
        });
    }
};


