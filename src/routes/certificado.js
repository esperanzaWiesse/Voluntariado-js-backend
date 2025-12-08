import { Router } from 'express';
import { descargarCertificadoGlobal } from '../controllers/certificado.js';
import { validarJWT } from '../middlewares/validar-jwt.js';

const router = Router();

router.use(validarJWT);

// Descargar certificado global (solo si > 100 horas)
router.get('/global/:idUsuario', validarJWT, descargarCertificadoGlobal);

export default router;
