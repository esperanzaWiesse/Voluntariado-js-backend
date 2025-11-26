const { response } = import('express');
const bcrypt = import('bcryptjs');

const Usuario = import('../models/usuario');
const { generarJWT } = import('../helpers/jwt');

// Crear la tabla al iniciar
Usuario.crearTabla();

// Crear usuario
const postUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.crear(req.body);
    res.status(201).json({
      ok: true,
      usuario
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      msg: error.message
    });
  }
};

// Obtener usuarios
const getUsuarios = async (req, res) => {
  try {
    const { limite = 10, desde = 0 } = req.query;
    const usuarios = await Usuario.obtenerTodos(Number(limite), Number(desde));
    
    res.json({
      ok: true,
      usuarios
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      msg: error.message
    });
  }
};

// Obtener usuario por ID
const getUsuarioPorId = async (req, res) => {
  try {
    const usuario = await Usuario.buscarPorId(req.params.id);
    
    if (!usuario) {
      return res.status(404).json({
        ok: false,
        msg: 'Usuario no encontrado'
      });
    }
    
    res.json({
      ok: true,
      usuario
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      msg: error.message
    });
  }
};

// Obtener usuario por ID
const getUsuarioId = async (req, res) => {
  try {
    const usuario = await Usuario.buscarPorId(req.params.id);
    
    if (!usuario) {
      return res.status(404).json({
        ok: false,
        msg: 'Usuario no encontrado'
      });
    }
    
    res.json({
      ok: true,
      usuario
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      msg: error.message
    });
  }
};

// Actualizar usuario
const updateUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.actualizar(req.params.id, req.body);
    
    res.json({
      ok: true,
      usuario
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      msg: error.message
    });
  }
};

// Eliminar usuario
const deleteUsuario = async (req, res) => {
  try {
    const eliminado = await Usuario.eliminar(req.params.id);
    
    if (!eliminado) {
      return res.status(404).json({
        ok: false,
        msg: 'Usuario no encontrado'
      });
    }
    
    res.json({
      ok: true,
      msg: 'Usuario eliminado'
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      msg: error.message
    });
  }
};


module.exports = {
    postUsuario,
    getUsuarios,
    getUsuarioId,
    updateUsuario,
    deleteUsuario
}