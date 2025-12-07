import { Router } from 'express';
import { 
    obtenerTodasActividades,
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
router.get('/', obtenerTodasActividades); // obtine los activos y los inactivos
router.get('/:id',  obtenerActividades); // obtine los activos y los inactivos
router.post('/', validarCampos('actividad'), crearActividad);
router.put('/:id',  validarCampos('actividad'), actualizarActividad);
router.delete('/delete/:id',  eliminarActividad);

router.get('/activos', obtenerActividades); // obtine solo los activos

export default router;