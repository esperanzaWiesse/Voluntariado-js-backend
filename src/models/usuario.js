const db = require('../db');

class Usuario {
  
  // Crear la tabla si no existe
  static async crearTabla() {
    const query = `
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        img VARCHAR(255),
        role VARCHAR(50) NOT NULL DEFAULT 'USER_ROLE',
        google BOOLEAN DEFAULT false,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    
    try {
      await db.query(query);
      console.log('Tabla usuarios creada o ya existe');
    } catch (error) {
      console.error('Error creando tabla:', error);
      throw error;
    }
  }

  // Crear un nuevo usuario
  static async crear(usuarioData) {
    const { nombre, email, password, img = null, role = 'USER_ROLE', google = false } = usuarioData;
    
    const query = `
      INSERT INTO usuarios (nombre, email, password, img, role, google)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    try {
      const [result] = await db.query(query, [nombre, email, password, img, role, google]);
      return {
        id: result.insertId,
        nombre,
        email,
        img,
        role,
        google
      };
    } catch (error) {
      throw error;
    }
  }

  // Buscar por ID
  static async buscarPorId(id) {
    const query = 'SELECT * FROM usuarios WHERE id = ?';
    
    try {
      const [rows] = await db.query(query, [id]);
      if (rows.length === 0) return null;
      
      return Usuario.formatearRespuesta(rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Buscar por email
  static async buscarPorEmail(email) {
    const query = 'SELECT * FROM usuarios WHERE email = ?';
    
    try {
      const [rows] = await db.query(query, [email]);
      if (rows.length === 0) return null;
      
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Obtener todos los usuarios
  static async obtenerTodos(limite = 10, desde = 0) {
    const query = 'SELECT * FROM usuarios LIMIT ? OFFSET ?';
    
    try {
      const [rows] = await db.query(query, [limite, desde]);
      return rows.map(row => Usuario.formatearRespuesta(row));
    } catch (error) {
      throw error;
    }
  }

  // Actualizar usuario
  static async actualizar(id, usuarioData) {
    const campos = [];
    const valores = [];
    
    // Construir dinámicamente la query
    if (usuarioData.nombre) {
      campos.push('nombre = ?');
      valores.push(usuarioData.nombre);
    }
    if (usuarioData.email) {
      campos.push('email = ?');
      valores.push(usuarioData.email);
    }
    if (usuarioData.password) {
      campos.push('password = ?');
      valores.push(usuarioData.password);
    }
    if (usuarioData.img !== undefined) {
      campos.push('img = ?');
      valores.push(usuarioData.img);
    }
    if (usuarioData.role) {
      campos.push('role = ?');
      valores.push(usuarioData.role);
    }
    
    if (campos.length === 0) {
      throw new Error('No hay campos para actualizar');
    }
    
    valores.push(id);
    const query = `UPDATE usuarios SET ${campos.join(', ')} WHERE id = ?`;
    
    try {
      await db.query(query, valores);
      return await Usuario.buscarPorId(id);
    } catch (error) {
      throw error;
    }
  }

  // Eliminar usuario
  static async eliminar(id) {
    const query = 'DELETE FROM usuarios WHERE id = ?';
    
    try {
      const [result] = await db.query(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Formatear respuesta (similar al toJSON de Mongoose)
  static formatearRespuesta(usuario) {
    const { password, fecha_creacion, fecha_actualizacion, ...usuarioSinPassword } = usuario;
    return {
      uid: usuario.id,
      ...usuarioSinPassword
    };
  }
}

module.exports = Usuario;