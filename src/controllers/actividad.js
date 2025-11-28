import bcrypt from 'bcryptjs';
import pool from '../config/database.js';

// Obtener todas las actividades o una específica
export const obtenerActividades = async (req, res) => {
    try {
        const { id } = req.params;
        
        const accion = 'SELECT';
        const idActividad = id ? parseInt(id) : null;
        
        const [result] = await pool.query(
            'CALL sp_Actividad_CRUD(?, ?, NULL, NULL, NULL, NULL)',
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


// Crear un nueva actividad
export const crearActividad = async (req, res) => {
    try {
        const { 
            nombre, 
            descripcion, 
            fecha, 
            duracionhoras, 
        } = req.body;

        // Validaciones básicas
        if (!nombre || !descripcion || !fecha || !duracionhoras) {
            return res.status(400).json({
                ok: false,
                msg: 'Todos los campos obligatorios deben ser completados'
            });
        }

        // Insertar usuario
        const [result] = await pool.query(
            'CALL sp_Actividad_CRUD(?, NULL, ?, ?, ?, ?)',
            [
                'INSERT',
                nombre, 
                descripcion, 
                fecha, 
                duracionhoras, 
            ]
        );

        const respuesta = result[0][0];

        res.status(201).json({
            ok: true,
            msg: respuesta.Mensaje,
            idActividad: respuesta.idActividad
        });

    } catch (error) {
        console.error('Error al crear actividad:', error);
        
        // Manejo de errores específicos
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
            nombre, 
            descripcion, 
            fecha, 
            duracionhoras,
        } = req.body;

        const [result] = await pool.query(
            'CALL sp_Actividad_CRUD(?, ?, ?, ?, ?, ?)',
            [
                'UPDATE',
                parseInt(id),
                nombre || null,
                descripcion || null,
                fecha || null,
                duracionhoras || null
            ]
        );

        const respuesta = result[0][0];

        res.status(200).json({
            ok: true,
            msg: respuesta.Mensaje,
            idActividad: respuesta.idActividad
        });

    } catch (error) {
        console.error('Error al actualizar actividad:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al actualizar actividad',
            error: error.message
        });
    }
};

export const eliminarActividad = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query(
            'CALL sp_Actividad_CRUD(?, ?, NULL, NULL, NULL, NULL)',
            ['DELETE', parseInt(id)]
        );

        const respuesta = result[0][0];

        res.status(200).json({
            ok: true,
            msg: respuesta.Mensaje
        });

    } catch (error) {
        console.error('Error al eliminar actividad:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al eliminar actividad',
            error: error.message
        });
    }
};