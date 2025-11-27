import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import { generarJWT } from '../helpers/jwt.js';

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validar que vengan los datos
        if (!email || !password) {
            return res.status(400).json({
                ok: false,
                msg: 'Email y contraseña son requeridos'
            });
        }

        // Buscar usuario por email
        const [result] = await pool.query(
            'CALL sp_Usuario_CRUD(?, NULL, NULL, NULL, NULL, NULL, ?, NULL, NULL, NULL)',
            ['SELECT', email]
        );

        const usuario = result[0][0];

        // Verificar si existe el usuario
        if (!usuario) {
            return res.status(400).json({
                ok: false,
                msg: 'Credenciales incorrectas'
            });
        }

        // Verificar contraseña
        const validPassword = bcrypt.compareSync(password, usuario.password);

        if (!validPassword) {
            return res.status(400).json({
                ok: false,
                msg: 'Credenciales incorrectas'
            });
        }

        // Generar JWT
        const token = await generarJWT(usuario.idUsuario, usuario.email);

        // Remover password de la respuesta
        const { password: _, ...usuarioSinPassword } = usuario;

        res.status(200).json({
            ok: true,
            token,
            usuario: usuarioSinPassword,
            msg: 'Login exitoso'
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al iniciar sesión',
            error: error.message
        });
    }
};

export const renovarToken = async (req, res) => {
    try {
        const idUsuario = req.idUsuario;

        // Buscar usuario por ID
        const [result] = await pool.query(
            'CALL sp_Usuario_CRUD(?, ?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)',
            ['SELECT', idUsuario]
        );

        const usuario = result[0][0];

        if (!usuario) {
            return res.status(404).json({
                ok: false,
                msg: 'Usuario no encontrado'
            });
        }

        // Generar nuevo JWT
        const token = await generarJWT(usuario.idUsuario, usuario.email);

        // Remover password de la respuesta
        const { password: _, ...usuarioSinPassword } = usuario;

        res.status(200).json({
            ok: true,
            token,
            usuario: usuarioSinPassword
        });

    } catch (error) {
        console.error('Error al renovar token:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al renovar token',
            error: error.message
        });
    }
};