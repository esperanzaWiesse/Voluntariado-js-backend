import bcrypt from 'bcryptjs';
import pool from '../config/database.js';

// Obtener todos los usuarios o uno específico
export const obtenerUsuarios = async (req, res) => {
    try {
        const { id } = req.params;
        
        const accion = 'SELECTALL';
        const idUsuario = id ? parseInt(id) : null;
        
        const [result] = await pool.query(
            'CALL sp_Usuario_CRUD(?, ?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)',
            [accion, idUsuario]
        );

        const usuarios = result[0];
        
        // Remover passwords de la respuesta
        const usuariosSinPassword = usuarios.map(usuario => {
            const { password, ...usuarioSinPass } = usuario;
            return usuarioSinPass;
        });

        res.status(200).json({
            ok: true,
            usuarios: usuariosSinPassword
        });

    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener usuarios',
            error: error.message
        });
    }
};

// Obtener todos los usuarios activos
export const obtenerUsuariosActivos = async (req, res) => {
    try {
        const { id } = req.params;
        
        const accion = 'SELECT';
        const idUsuario = id ? parseInt(id) : null;
        
        const [result] = await pool.query(
            'CALL sp_Usuario_CRUD(?, ?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)',
            [accion, idUsuario]
        );

        const usuarios = result[0];
        
        // Remover passwords de la respuesta
        const usuariosSinPassword = usuarios.map(usuario => {
            const { password, ...usuarioSinPass } = usuario;
            return usuarioSinPass;
        });

        res.status(200).json({
            ok: true,
            usuarios: usuariosSinPassword
        });

    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener usuarios',
            error: error.message
        });
    }
};

// Crear un nuevo usuario
export const crearUsuario = async (req, res) => {
    try {
        const { 
            nombre, 
            apPaterno, 
            apMaterno, 
            dni, 
            rol,
            email, 
            password,
            codUniversitario,
            tipoCodUniversitario
        } = req.body;

        // Validaciones básicas
        if (!nombre || !apPaterno || !apMaterno || !dni || !email || !password) {
            return res.status(400).json({
                ok: false,
                msg: 'Todos los campos obligatorios deben ser completados'
            });
        }

        // Encriptar contraseña
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        // Insertar usuario
        const [result] = await pool.query(
            'CALL sp_Usuario_CRUD(?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                'INSERT',
                nombre,
                apPaterno,
                apMaterno,
                dni,
                rol,
                email,
                hashedPassword,
                codUniversitario || null,
                tipoCodUniversitario || null
            ]
        );

        const respuesta = result[0][0];

        res.status(201).json({
            ok: true,
            msg: respuesta.Mensaje,
            idUsuario: respuesta.idUsuario
        });

    } catch (error) {
        console.error('Error al crear usuario:', error);
        
        // Manejo de errores específicos
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                ok: false,
                msg: 'El DNI o email ya están registrados'
            });
        }

        res.status(500).json({
            ok: false,
            msg: 'Error al crear usuario',
            error: error.message
        });
    }
};

// Actualizar usuario
export const actualizarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            nombre, 
            apPaterno, 
            apMaterno, 
            dni, 
            rol,
            email, 
            password,
            codUniversitario,
            tipoCodUniversitario
        } = req.body;

        let hashedPassword = null;
        if (password) {
            const salt = bcrypt.genSaltSync(10);
            hashedPassword = bcrypt.hashSync(password, salt);
        }

        const [result] = await pool.query(
            'CALL sp_Usuario_CRUD(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                'UPDATE',
                parseInt(id),
                nombre || null,
                apPaterno || null,
                apMaterno || null,
                dni || null,
                rol || null,
                email || null,
                hashedPassword,
                codUniversitario || null,
                tipoCodUniversitario || null
            ]
        );

        const respuesta = result[0][0];

        res.status(200).json({
            ok: true,
            msg: respuesta.Mensaje,
            idUsuario: respuesta.idUsuario
        });

    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al actualizar usuario',
            error: error.message
        });
    }
};

// Eliminar usuario
export const eliminarUsuario = async (req, res) => {

    // obteniendo el valor del campo activo
    try {
       const { id } = req.params;
        
        const accion = 'SELECT';
        const idUsuario = id ? parseInt(id) : null;
        
        const [result] = await pool.query(
            'CALL sp_Usuario_CRUD(?, ?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)',
            [accion, idUsuario]
        );

        const usuarios = result[0];
        
        // Remover passwords de la respuesta
        const usuariosSinPassword = usuarios.map(usuario => {
            const { password, ...usuarioSinPass } = usuario;
            return usuarioSinPass;
        });

        const estadoUsuario = usuariosSinPassword[0].activo;

        // condicion para activar o desactivar
        if( estadoUsuario === 1 ){
            // desactivar usuario
            try {
                const { id } = req.params;

                const [result] = await pool.query(
                    'CALL sp_Usuario_CRUD(?, ?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)',
                    ['DELETE', parseInt(id)]
                );

                const respuesta = result[0][0];

                res.status(200).json({
                    ok: true,
                    msg: respuesta.Mensaje
                });

            } catch (error) {
                console.error('Error al eliminar usuario:', error);
                res.status(500).json({
                    ok: false,
                    msg: 'Error al eliminar usuario',
                    error: error.message
                });
            }

        } else {
            // activar usuario
            try {
                const { id } = req.params;

                const [result] = await pool.query(
                    'CALL sp_Usuario_CRUD(?, ?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)',
                    ['RESTORE', parseInt(id)]
                );

                const respuesta = result[0][0];

                res.status(200).json({
                    ok: true,
                    msg: respuesta.Mensaje
                });

            } catch (error) {
                console.error('Error al eliminar usuario:', error);
                res.status(500).json({
                    ok: false,
                    msg: 'Error al eliminar usuario',
                    error: error.message
                });
            }
        }

    } catch (error) {
        console.error('Error al buscar usuario por DNI:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al buscar usuario',
            error: error.message
        });
    }
};

// Buscar usuario por DNI
export const buscarPorDNI = async (req, res) => {
    try {
        const { dni } = req.params;

        const [result] = await pool.query(
            'CALL sp_Usuario_CRUD(?, NULL, NULL, NULL, NULL, ?, NULL, NULL, NULL, NULL, NULL)',
            ['SELECT', parseInt(dni)]
        );

        const usuario = result[0][0];

        if (!usuario) {
            return res.status(404).json({
                ok: false,
                msg: 'Usuario no encontrado'
            });
        }

        const { password, ...usuarioSinPass } = usuario;

        res.status(200).json({
            ok: true,
            usuario: usuarioSinPass
        });

    } catch (error) {
        console.error('Error al buscar usuario por DNI:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al buscar usuario',
            error: error.message
        });
    }
};