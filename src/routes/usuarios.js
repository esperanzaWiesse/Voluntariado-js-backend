/*
    Ruta: /api/usuarios
*/
const { Router } = import('express');
const { check } = import('express-validator');
const { validarCampos } = import('../middlewares/validar-campos');

const { postUsuario, getUsuarios, getUsuarioId, updateUsuario, deleteUsuario } = import('../controllers/usuarios');

const { 
    validarJWT, 
    varlidarADMIN_ROLE,
    varlidarADMIN_ROLE_o_MismoUsuario
 } = import('../middlewares/validar-jwt');


const router = Router();


router.get( '/', validarJWT , getUsuarios );

router.post( '/',
    [
        check('nombre', 'El nombre es obligatorio').not().isEmpty(),
        check('password', 'El password es obligatorio').not().isEmpty(),
        check('email', 'El email es obligatorio').isEmail(),
        validarCampos,
    ], 
    postUsuario 
);

router.put( '/:id',
    [
        validarJWT,
        varlidarADMIN_ROLE_o_MismoUsuario,
        check('nombre', 'El nombre es obligatorio').not().isEmpty(),
        check('email', 'El email es obligatorio').isEmail(),
        check('role', 'El role es obligatorio').not().isEmpty(),
        validarCampos,
    ],
    updateUsuario
);

router.delete( '/:id',
    [ validarJWT, varlidarADMIN_ROLE ],
    deleteUsuario
);



module.exports = router;