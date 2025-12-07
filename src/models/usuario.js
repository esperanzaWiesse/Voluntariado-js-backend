import db from '../config/database.js';
import bcrypt from 'bcrypt';

class Usuario {

  // Crear un nuevo usuario usando SP (con hash automático)
  static async crear(usuarioData) {
    const {
      nombre,
      apPaterno,
      apMaterno,
      dni,
      email,
      password,
      codUniversitario = null,
      tipoCodUniversitario = null
    } = usuarioData;

    try {
      // Hashear el password antes de insertar
      const passwordHash = await bcrypt.hash(password, 10);

      const [result] = await db.query(
        'CALL sp_Usuario_CRUD(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          'INSERT',
          null,
          nombre,
          apPaterno,
          apMaterno,
          dni,
          email,
          passwordHash, // Password hasheado
          codUniversitario,
          tipoCodUniversitario,
          null // rol
        ]
      );

      const insertResult = result[0][0];

      if (insertResult.ErrorNumber) {
        throw new Error(insertResult.ErrorMessage);
      }

      return {
        idUsuario: insertResult.idUsuario,
        mensaje: insertResult.Mensaje,
        nombre,
        apPaterno,
        apMaterno,
        dni,
        email,
        codUniversitario,
        tipoCodUniversitario
      };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.message.includes('dni')) {
          throw new Error('El DNI ya está registrado');
        }
        if (error.message.includes('email')) {
          throw new Error('El email ya está registrado');
        }
      }
      throw error;
    }
  }

  // Buscar por ID usando SP
  static async buscarPorId(id) {
    try {
      const [result] = await db.query(
        'CALL sp_Usuario_CRUD(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['SELECT', id, null, null, null, null, null, null, null, null, null]
      );

      const usuarios = result[0];
      if (usuarios.length === 0) return null;

      return Usuario.formatearRespuesta(usuarios[0]);
    } catch (error) {
      throw error;
    }
  }

  // Buscar por email usando SP
  static async buscarPorEmail(email) {
    try {
      const [result] = await db.query(
        'CALL sp_Usuario_CRUD(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['SELECT', null, null, null, null, null, email, null, null, null, null]
      );

      const usuarios = result[0];
      if (usuarios.length === 0) return null;

      return usuarios[0]; // Retorna con password para autenticación
    } catch (error) {
      throw error;
    }
  }

  // Buscar por DNI usando SP
  static async buscarPorDni(dni) {
    try {
      const [result] = await db.query(
        'CALL sp_Usuario_CRUD(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['SELECT', null, null, null, null, dni, null, null, null, null, null]
      );

      const usuarios = result[0];
      if (usuarios.length === 0) return null;

      return Usuario.formatearRespuesta(usuarios[0]);
    } catch (error) {
      throw error;
    }
  }

  // Obtener todos los usuarios usando SP
  static async obtenerTodos(limite = 10, desde = 0) {
    try {
      const [result] = await db.query(
        'CALL sp_Usuario_CRUD(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['SELECT', null, null, null, null, null, null, null, null, null, null]
      );

      const usuarios = result[0];
      const usuariosPaginados = usuarios.slice(desde, desde + limite);

      return usuariosPaginados.map(row => Usuario.formatearRespuesta(row));
    } catch (error) {
      throw error;
    }
  }

  // Actualizar usuario usando SP (hashea password si se proporciona)
  static async actualizar(id, usuarioData) {
    const {
      nombre,
      apPaterno,
      apMaterno,
      dni,
      email,
      password,
      codUniversitario,
      tipoCodUniversitario
    } = usuarioData;

    try {
      // Si se proporciona un nuevo password, hashearlo
      let passwordHash = password ? await bcrypt.hash(password, 10) : null;

      const [result] = await db.query(
        'CALL sp_Usuario_CRUD(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          'UPDATE',
          id,
          nombre || null,
          apPaterno || null,
          apMaterno || null,
          dni || null,
          email || null,
          passwordHash,
          codUniversitario || null,
          tipoCodUniversitario || null,
          null // rol
        ]
      );

      const updateResult = result[0][0];

      if (updateResult.ErrorNumber) {
        throw new Error(updateResult.ErrorMessage);
      }

      return await Usuario.buscarPorId(id);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.message.includes('dni')) {
          throw new Error('El DNI ya está registrado');
        }
        if (error.message.includes('email')) {
          throw new Error('El email ya está registrado');
        }
      }
      throw error;
    }
  }

  // Eliminar usuario usando SP
  static async eliminar(id) {
    try {
      const [result] = await db.query(
        'CALL sp_Usuario_CRUD(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['DELETE', id, null, null, null, null, null, null, null, null, null]
      );

      const deleteResult = result[0][0];

      if (deleteResult.ErrorNumber) {
        throw new Error(deleteResult.ErrorMessage);
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Verificar password
  static async verificarPassword(passwordPlain, passwordHash) {
    return await bcrypt.compare(passwordPlain, passwordHash);
  }

  // Autenticar usuario (para login)
  static async autenticar(email, password) {
    try {
      const usuario = await Usuario.buscarPorEmail(email);

      if (!usuario) {
        throw new Error('Usuario no encontrado');
      }

      const passwordValido = await bcrypt.compare(password, usuario.password);

      if (!passwordValido) {
        throw new Error('Contraseña incorrecta');
      }

      // Retornar usuario sin password
      return Usuario.formatearRespuesta(usuario);
    } catch (error) {
      throw error;
    }
  }

  // Formatear respuesta (elimina password)
  static formatearRespuesta(usuario) {
    const {
      password,
      fecha_creacion,
      fecha_actualizacion,
      ...usuarioSinPassword
    } = usuario;

    return {
      uid: usuario.idUsuario,
      ...usuarioSinPassword
    };
  }

  // Contar total de usuarios
  static async contarTotal() {
    try {
      const usuarios = await Usuario.obtenerTodos(999999, 0);
      return usuarios.length;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Usuario;