import { Router } from 'express';
import { login, renovarToken } from '../controllers/autenticacion.js';
import { validarJWT } from '../middlewares/validar-jwt.js';

const router = Router();

// Ruta de login - pública
router.post('/login', login);

// Renovar token - requiere token válido
router.get('/renew', validarJWT, renovarToken);

export default router;