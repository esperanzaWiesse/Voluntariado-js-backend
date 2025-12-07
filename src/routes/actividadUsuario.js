import { Router } from 'express';
import {
    registrarParticipacion,
    actualizarParticipacion,
    eliminarParticipacion,
    obtenerParticipantesActividad,
    obtenerActividadesUsuario
} from '../controllers/actividadUsuario.js';
import { validarJWT } from '../middlewares/validar-jwt.js';

const router = Router();

// Todas las rutas protegidas
router.use(validarJWT);

// Rutas de participación
router.post('/registrar', registrarParticipacion); // Body: idActividad, idUsuario, horasRealizadas, completado
router.put('/:idActividad/:idUsuario', actualizarParticipacion);
router.delete('/:idActividad/:idUsuario', eliminarParticipacion);

// Consultas
router.get('/participantes/:idActividad', obtenerParticipantesActividad);
router.get('/usuario/:idUsuario', obtenerActividadesUsuario);

export default router;
