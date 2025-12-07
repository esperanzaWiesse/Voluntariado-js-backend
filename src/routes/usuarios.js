import { Router } from 'express';
import { 
    obtenerTodosUsuarios,
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
router.get('/', validarJWT, obtenerTodosUsuarios); // obtine los activos y los inactivos
router.get('/:id', validarJWT, obtenerUsuarios); // obtine los activos y los inactivos
// router.get('/dni/:dni', buscarPorDNI);  // no se esta usando (se esta haciendo la busqueda desde angular )
// router.get('/busqueda/:termino', buscarPorDNI); // no se esta usando (se esta haciendo la busqueda desde angular )
router.post('/',validarJWT,  validarCampos('usuario'), crearUsuario);
router.put('/:id',validarJWT,   validarCampos('usuario'), actualizarUsuario);
router.delete('/delete/:id',validarJWT, eliminarUsuario);

export default router;