import { Router } from 'express';
import { 
    obtenerGrupoVoluntario,
    crearGrupoVoluntario,
    actualizarGrupoVoluntario,
    eliminarGrupoVoluntario
} from '../controllers/grupoVoluntario.js';
import { validarCampos } from '../middlewares/validar-campos.js';

const router = Router();

// Rutas públicas
// (ninguna - todas requieren autenticación)

// Rutas protegidas - requieren autenticación
router.get('/', obtenerGrupoVoluntario);
router.get('/:id',  obtenerGrupoVoluntario);
router.post('/', validarCampos('grupoVoluntario'), crearGrupoVoluntario);
router.put('/:id',  validarCampos('grupoVoluntario'), actualizarGrupoVoluntario);
router.delete('/:id',  eliminarGrupoVoluntario);
export default router;