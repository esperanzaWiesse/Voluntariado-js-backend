import jwt from 'jsonwebtoken';

export const validarJWT = (req, res, next) => {
    // Leer el token del header
    const token = req.header('x-token');

    if (!token) {
        return res.status(401).json({
            ok: false,
            msg: 'No hay token en la petición'
        });
    }

    try {
        // Verificar token
        const { idUsuario, email } = jwt.verify(token, process.env.JWT_SECRET);

        // Agregar datos al request
        req.idUsuario = idUsuario;
        req.email = email;

        next();

    } catch (error) {
        return res.status(401).json({
            ok: false,
            msg: 'Token no válido'
        });
    }
};