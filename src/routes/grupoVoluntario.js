import { Router } from 'express';
import {
    obtenerTodosGrupoVoluntario,
    obtenerGrupoVoluntario,
    crearGrupoVoluntario,
    actualizarGrupoVoluntario,
    eliminarGrupoVoluntario
} from '../controllers/grupoVoluntario.js';
import { validarJWT } from '../middlewares/validar-jwt.js';
import { validarCampos } from '../middlewares/validar-campos.js';

const router = Router();

// Rutas públicas
// (ninguna - todas requieren autenticación)

// Rutas protegidas - requieren autenticación
router.get('/', validarJWT, obtenerTodosGrupoVoluntario); // obtine los activos y los inactivos
router.get('/:id', validarJWT, obtenerGrupoVoluntario); // obtine los activos y los inactivos
router.post('/', validarJWT, validarCampos('grupoVoluntario'), crearGrupoVoluntario);
router.put('/:id', validarJWT, validarCampos('grupoVoluntario'), actualizarGrupoVoluntario);
router.delete('/delete/:id', validarJWT, eliminarGrupoVoluntario);

router.get('/activos', validarJWT, obtenerGrupoVoluntario); // obtine solo los activos


export default router;