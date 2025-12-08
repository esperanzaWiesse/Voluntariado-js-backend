import { Router } from 'express';
import {
    inscribirUsuario,
    actualizarCargo,
    gestionarEstadoInscripcion,
    obtenerMiembrosGrupo,
    obtenerGruposUsuario
} from '../controllers/grupoVoluntarioUsuario.js';
import { validarJWT } from '../middlewares/validar-jwt.js';

const router = Router();

router.use(validarJWT);

// Rutas de Inscripción
router.post('/inscribir', inscribirUsuario); // Body: idGrupoVoluntariado, idUsuario, idCargo
router.put('/:idGrupo/:idUsuario', actualizarCargo); // Body: idCargo
router.delete('/:idGrupo/:idUsuario', gestionarEstadoInscripcion); // Toggle activo/inactivo

// Consultas
router.get('/miembros/:idGrupo', obtenerMiembrosGrupo);
router.get('/usuario/:idUsuario', obtenerGruposUsuario);

export default router;
//  /api/inscripciones/inscribir