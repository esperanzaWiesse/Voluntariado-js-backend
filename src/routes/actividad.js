import { Router } from 'express';
import { 
    obtenerActividades, 
    crearActividad,
    actualizarActividad,
    eliminarActividad
} from '../controllers/actividad.js';
import { validarCampos } from '../middlewares/validar-campos.js';

const router = Router();

// Rutas públicas
// (ninguna - todas requieren autenticación)

// Rutas protegidas - requieren autenticación
router.get('/', obtenerActividades);
router.get('/:id',  obtenerActividades);
router.post('/', validarCampos('actividad'), crearActividad);
router.put('/:id',  validarCampos('actividad'), actualizarActividad);
router.delete('/:id',  eliminarActividad);

export default router;