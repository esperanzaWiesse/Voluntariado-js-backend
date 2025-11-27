import jwt from 'jsonwebtoken';

export const generarJWT = (idUsuario, email) => {
    return new Promise((resolve, reject) => {
        const payload = { idUsuario, email };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            {
                expiresIn: '24h'
            },
            (err, token) => {
                if (err) {
                    console.error('Error al generar JWT:', err);
                    reject('No se pudo generar el token');
                } else {
                    resolve(token);
                }
            }
        );
    });
};