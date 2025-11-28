import { Router } from 'express';
import { 
    obtenerUsuarios, 
    crearUsuario, 
    actualizarUsuario, 
    eliminarUsuario,
    buscarPorDNI
} from '../controllers/usuarios.js';
import { validarJWT } from '../middlewares/validar-jwt.js';
import { validarCampos } from '../middlewares/validar-campos.js';

const router = Router();

// Rutas públicas
// (ninguna - todas requieren autenticación)

// Rutas protegidas - requieren autenticación
// router.get('/', validarJWT, obtenerUsuarios);
// router.get('/:id', validarJWT, obtenerUsuarios);
// router.get('/dni/:dni', validarJWT, buscarPorDNI);
// router.post('/', validarJWT, validarCampos, crearUsuario);
// router.put('/:id', validarJWT, validarCampos, actualizarUsuario);
// router.delete('/:id', validarJWT, eliminarUsuario);

// solo para hacer pruevaas sin el frontend 
router.get('/', obtenerUsuarios);
router.get('/:id',  obtenerUsuarios);
router.get('/dni/:dni', buscarPorDNI);
router.post('/', validarCampos('usuario'), crearUsuario);
router.put('/:id',  validarCampos('usuario'), actualizarUsuario);
router.delete('/:id',  eliminarUsuario);

export default router;