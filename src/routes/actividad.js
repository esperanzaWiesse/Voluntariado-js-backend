import { Router } from 'express';
import {
    obtenerTodasActividades,
    obtenerActividadPorId,
    obtenerActividadesPorGrupo,
    crearActividad,
    actualizarActividad,
    eliminarActividad
} from '../controllers/actividad.js';
import { validarCampos } from '../middlewares/validar-campos.js';
import { validarJWT } from '../middlewares/validar-jwt.js';

const router = Router();

// Rutas públicas
// (ninguna - todas requieren autenticación)

// Rutas protegidas - requieren autenticación

router.get('/', validarJWT, obtenerTodasActividades);
router.get('/:id', validarJWT, obtenerActividadPorId);
router.get('/grupo/:idGrupo', validarJWT, obtenerActividadesPorGrupo);
router.post('/', validarJWT, validarCampos('actividad'), crearActividad);
router.put('/:id', validarJWT, validarCampos('actividad'), actualizarActividad);
router.delete('/grupo/:idGrupo/actividad/:id', validarJWT, eliminarActividad);


export default router;