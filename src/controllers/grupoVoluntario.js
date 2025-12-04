import pool from '../config/database.js';

// Obtener todos los grupoVoluntario
export const obtenerGrupoVoluntario = async (req, res) => {
    try {
        const { id } = req.params;
        
        const accion = 'SELECT';
        const idActividad = id ? parseInt(id) : null;
        
        const [result] = await pool.query(
            'CALL sp_GrupoVoluntariado_CRUD(?, ?, NULL, NULL)',
            [accion, idActividad]
        );

        const grupoVoluntario = result[0];
        
        res.status(200).json({
            ok: true,
            grupoVoluntario: grupoVoluntario
        });

    } catch (error) {
        console.error('Error al obtener grupoVoluntario:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener grupoVoluntario',
            error: error.message
        });
    }
};

// Crear un nuevo grupoVoluntario
export const crearGrupoVoluntario = async (req, res) => {
    try {
        const { 
            nombreGrupoVoluntariado, 
            fechaCreacionGrupoVoluntariado,
        } = req.body;

        // Validaciones básicas
        if (!nombreGrupoVoluntariado || !fechaCreacionGrupoVoluntariado) {
            return res.status(400).json({
                ok: false,
                msg: 'Todos los campos obligatorios deben ser completados'
            });
        }

        // Insertar usuario
        const [result] = await pool.query(
            'CALL sp_GrupoVoluntariado_CRUD(?, NULL, ?, ?)',
            [
                'INSERT',
                nombreGrupoVoluntariado, 
                fechaCreacionGrupoVoluntariado, 
            ]
        );

        const respuesta = result[0][0];

        res.status(201).json({
            ok: true,
            msg: respuesta.Mensaje,
            idGrupoVoluntario: respuesta.idGrupoVoluntario
        });

    } catch (error) {
        console.error('Error al crear grupoVoluntario:', error);
        
        // Manejo de errores específicos
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                ok: false,
                msg: 'El grupo voluntario ya está registrado'
            });
        }

        res.status(500).json({
            ok: false,
            msg: 'Error al crear grupoVoluntario',
            error: error.message
        });
    }
};

// Actualizar grupoVoluntario
export const actualizarGrupoVoluntario = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            nombreGrupoVoluntariado, 
            fechaCreacionGrupoVoluntariado,
        } = req.body;

        const [result] = await pool.query(
            'CALL sp_GrupoVoluntariado_CRUD(?, ?, ?, ?)',
            [
                'UPDATE',
                parseInt(id),
                nombreGrupoVoluntariado || null,
                fechaCreacionGrupoVoluntariado || null
            ]
        );

        const respuesta = result[0][0];

        res.status(200).json({
            ok: true,
            msg: respuesta.Mensaje,
            idGrupoVoluntario: respuesta.idGrupoVoluntario
        });

    } catch (error) {
        console.error('Error al actualizar grupoVoluntario:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al actualizar grupoVoluntario',
            error: error.message
        });
    }
};

export const eliminarGrupoVoluntario = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query(
            'CALL sp_GrupoVoluntariado_CRUD(?, ?, NULL, NULL)',
            ['DELETE', parseInt(id)]
        );

        const respuesta = result[0][0];

        res.status(200).json({
            ok: true,
            msg: respuesta.Mensaje
        });

    } catch (error) {
        console.error('Error al eliminar grupoVoluntario:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al eliminar grupoVoluntario',
            error: error.message
        });
    }
};