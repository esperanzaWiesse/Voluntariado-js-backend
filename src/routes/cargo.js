import { Router } from 'express';
import {
    obtenerTodosCargos,
    obtenerCargos,
    crearCargo,
    actualizarCargo,
    eliminarCargo
} from '../controllers/cargo.js';
import { validarJWT } from '../middlewares/validar-jwt.js';
import { validarCampos } from '../middlewares/validar-campos.js';

const router = Router();

// Rutas públicas
// (ninguna - todas requieren autenticación)

// Rutas protegidas - requieren autenticación
router.get('/', validarJWT, obtenerTodosCargos); // obtine los activos y los inactivos
router.get('/:id', validarJWT, obtenerCargos); // obtine los activos y los inactivos
router.post('/', validarJWT, validarCampos('cargo'), crearCargo);
router.put('/:id', validarJWT, validarCampos('cargo'), actualizarCargo);
router.delete('/delete/:id', validarJWT, eliminarCargo);

router.get('/activos', validarJWT, obtenerCargos); // obtine solo los activos

export default router;
