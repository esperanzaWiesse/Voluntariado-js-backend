export const validarCampos = (req, res, next) => {
    const { body, method } = req;

    // Validaciones para POST (crear usuario)
    if (method === 'POST') {
        const { nombre, apPaterno, apMaterno, dni, email, password } = body;

        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({
                ok: false,
                msg: 'El nombre es obligatorio'
            });
        }

        if (!apPaterno || apPaterno.trim() === '') {
            return res.status(400).json({
                ok: false,
                msg: 'El apellido paterno es obligatorio'
            });
        }

        if (!apMaterno || apMaterno.trim() === '') {
            return res.status(400).json({
                ok: false,
                msg: 'El apellido materno es obligatorio'
            });
        }

        if (!dni || isNaN(dni)) {
            return res.status(400).json({
                ok: false,
                msg: 'El DNI es obligatorio y debe ser numérico'
            });
        }

        if (!email || !validarEmail(email)) {
            return res.status(400).json({
                ok: false,
                msg: 'El email es obligatorio y debe ser válido'
            });
        }

        if (!password || password.length < 6) {
            return res.status(400).json({
                ok: false,
                msg: 'La contraseña es obligatoria y debe tener al menos 6 caracteres'
            });
        }
    }

    // Validaciones para PUT (actualizar usuario)
    if (method === 'PUT') {
        const { email, dni } = body;

        if (email && !validarEmail(email)) {
            return res.status(400).json({
                ok: false,
                msg: 'El email debe ser válido'
            });
        }

        if (dni && isNaN(dni)) {
            return res.status(400).json({
                ok: false,
                msg: 'El DNI debe ser numérico'
            });
        }
    }

    next();
};

// Función auxiliar para validar email
const validarEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};