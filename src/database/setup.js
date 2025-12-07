import bcrypt from 'bcryptjs';
import pool from '../config/database.js';

const crearUsuarioInicial = async () => {
    try {
        // Verificar si ya existe un usuario administrador
        const [usuarios] = await pool.query(
            'CALL sp_Usuario_CRUD(?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)',
            ['SELECT']
        );

        if (usuarios[0] && usuarios[0].length > 0) {
            console.log('✅ Ya existe al menos un usuario en el sistema');
            return;
        }

        // Datos del usuario inicial
        const usuarioInicial = {
            nombre: 'Administrador',
            apPaterno: 'Sistema',
            apMaterno: 'Voluntariado',
            dni: 99999999,
            email: 'admin@voluntariado.com',
            password: 'Admin123!',
            codUniversitario: 'ADMIN001',
            tipoCodUniversitario: 'Administrador'
        };

        // Encriptar contraseña
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(usuarioInicial.password, salt);

        // Insertar usuario usando el procedimiento almacenado
        const [result] = await pool.query(
            `CALL sp_Usuario_CRUD(?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'INSERT',
                usuarioInicial.nombre,
                usuarioInicial.apPaterno,
                usuarioInicial.apMaterno,
                usuarioInicial.dni,
                usuarioInicial.email,
                hashedPassword,
                usuarioInicial.codUniversitario,
                usuarioInicial.tipoCodUniversitario,
                'Administrador' // Rol
            ]
        );

        console.log('✅ Usuario inicial creado correctamente');
        console.log('📧 Email:', usuarioInicial.email);
        console.log('🔑 Password:', usuarioInicial.password);
        console.log('⚠️  Por favor, cambie estas credenciales después del primer inicio de sesión');

    } catch (error) {
        console.error('❌ Error al crear usuario inicial:', error);
        throw error;
    }
};

export default crearUsuarioInicial;