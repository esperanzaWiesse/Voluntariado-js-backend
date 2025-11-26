/*
    Path: '/api/login'
*/
const { Router } = import('express');
const { login, googleSignIn, renewToken } = import('../controllers/auth');
const { check } = import('express-validator');
const { validarCampos } = import('../middlewares/validar-campos');
const { validarJWT } = import('../middlewares/validar-jwt');

const router = Router();


router.post( '/',
    [
        check('email', 'El email es obligatorio').isEmail(),
        check('password', 'El password es obligatorio').not().isEmpty(),
        validarCampos
    ],
    login
);

router.post( '/google',
    [
        check('token', 'El token de Google es obligatorio').not().isEmpty(),
        validarCampos
    ],
    googleSignIn
)

router.get( '/renew',
    validarJWT,
    renewToken
)






module.exports = router;
