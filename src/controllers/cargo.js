import pool from '../config/database.js';

// Obtener todos los cargos o uno específico
export const obtenerTodosCargos = async (req, res) => {
    try {
        const { id } = req.params;

        const accion = 'SELECTALL';
        const idCargo = id ? parseInt(id) : null;

        const [result] = await pool.query(
            'CALL sp_Cargo_CRUD(?, ?, NULL, NULL, NULL)',
            [accion, idCargo]
        );

        const cargos = result[0];

        res.status(200).json({
            ok: true,
            cargos: cargos
        });

    } catch (error) {
        console.error('Error al obtener cargos:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener cargos',
            error: error.message
        });
    }
};

// Obtener todos los cargos (id, activos)
export const obtenerCargos = async (req, res) => {
    try {
        const { id } = req.params;

        const accion = 'SELECT';
        const idCargo = id ? parseInt(id) : null;

        const [result] = await pool.query(
            'CALL sp_Cargo_CRUD(?, ?, NULL, NULL, NULL)',
            [accion, idCargo]
        );

        const cargos = result[0];

        res.status(200).json({
            ok: true,
            cargos: cargos
        });

    } catch (error) {
        console.error('Error al obtener cargos:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener cargos',
            error: error.message
        });
    }
};

// Crear un nuevo cargo
export const crearCargo = async (req, res) => {
    try {
        const {
            nombreCargo,
            descripcion,
            fechaCreacion
        } = req.body;

        // Validaciones básicas
        if (!nombreCargo || !descripcion || !fechaCreacion) {
            return res.status(400).json({
                ok: false,
                msg: 'Todos los campos obligatorios deben ser completados'
            });
        }

        // Insertar cargo
        const [result] = await pool.query(
            'CALL sp_Cargo_CRUD(?, NULL, ?, ?, ?)',
            [
                'INSERT',
                nombreCargo,
                descripcion,
                fechaCreacion
            ]
        );

        const respuesta = result[0][0];

        res.status(201).json({
            ok: true,
            msg: respuesta.Mensaje,
            idCargo: respuesta.idCargo
        });

    } catch (error) {
        console.error('Error al crear cargo:', error);

        res.status(500).json({
            ok: false,
            msg: 'Error al crear cargo',
            error: error.message
        });
    }
};

// Actualizar cargo
export const actualizarCargo = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nombreCargo,
            descripcion,
            fechaCreacion
        } = req.body;

        const fecha = fechaCreacion ? new Date(fechaCreacion).toISOString().slice(0, 19).replace('T', ' ') : null;

        const [result] = await pool.query(
            'CALL sp_Cargo_CRUD(?, ?, ?, ?, ?)',
            [
                'UPDATE',
                parseInt(id),
                nombreCargo || null,
                descripcion || null,
                fecha
            ]
        );

        const respuesta = result[0][0];

        res.status(200).json({
            ok: true,
            msg: respuesta.Mensaje,
            idCargo: respuesta.idCargo
        });

    } catch (error) {
        console.error('Error al actualizar cargo:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al actualizar cargo',
            error: error.message
        });
    }
};

// Eliminar cargo
export const eliminarCargo = async (req, res) => {

    // obteniendo el valor del campo activo
    try {
        const { id } = req.params;

        const accion = 'SELECT';
        const idCargo = id ? parseInt(id) : null;

        const [result] = await pool.query(
            'CALL sp_Cargo_CRUD(?, ?, NULL, NULL, NULL)',
            [accion, idCargo]
        );

        const cargos = result[0];

        const estadoCargo = cargos[0].activo;

        // condicion para activar o desactivar
        if (estadoCargo === 1) {
            // desactivar cargo
            try {
                const { id } = req.params;

                const [result] = await pool.query(
                    'CALL sp_Cargo_CRUD(?, ?, NULL, NULL, NULL)',
                    ['DELETE', parseInt(id)]
                );

                const respuesta = result[0][0];

                res.status(200).json({
                    ok: true,
                    msg: respuesta.Mensaje
                });

            } catch (error) {
                console.error('Error al eliminar cargo:', error);
                res.status(500).json({
                    ok: false,
                    msg: 'Error al eliminar cargo',
                    error: error.message
                });
            }

        } else {
            // activar cargo
            try {
                const { id } = req.params;

                const [result] = await pool.query(
                    'CALL sp_Cargo_CRUD(?, ?, NULL, NULL, NULL)',
                    ['RESTORE', parseInt(id)]
                );

                const respuesta = result[0][0];

                res.status(200).json({
                    ok: true,
                    msg: respuesta.Mensaje
                });

            } catch (error) {
                console.error('Error al eliminar cargo:', error);
                res.status(500).json({
                    ok: false,
                    msg: 'Error al eliminar cargo',
                    error: error.message
                });
            }
        }

    } catch (error) {
        console.error('Error al buscar cargo por id:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al buscar cargo',
            error: error.message
        });
    }
};
