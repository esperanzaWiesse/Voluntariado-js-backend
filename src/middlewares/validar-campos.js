// Esquemas de validación por entidad
const esquemas = {
    usuario: {
        campos: {
            nombre: { requerido: true, tipo: 'string', min: 2, max: 100 },
            apPaterno: { requerido: true, tipo: 'string', min: 2, max: 100 },
            apMaterno: { requerido: true, tipo: 'string', min: 2, max: 100 },
            dni: { requerido: true, tipo: 'number', egex: /^[0-9]{8}$/  }, // verifica que siempre tenga 8 dígitos
            // dni: { requerido: true, tipo: 'string', regex: /^[1-9][0-9]{7}$/  }, // ^[1-9] → el primer dígito debe ser del 1 al 9 (no 0).  [0-9]{7} → los siguientes 7 dígitos deben ser números.
            email: { requerido: true, tipo: 'email' },
            password: { requerido: true, tipo: 'string', min: 6, max: 255 },
            codUniversitario: { requerido: false, tipo: 'string', max: 20 },
            tipoCodUniversitario: { requerido: false, tipo: 'string', max: 50 }
        }
    },
    actividad: {
        campos: {
            nombre: { requerido: true, tipo: 'string', min: 3, max: 200 },
            descripcion: { requerido: true, tipo: 'string', min: 10, max: 1000 },
            fecha: { requerido: true, tipo: 'date' },
            duracionhoras: { requerido: true, tipo: 'number', min: 1 },
            // ubicacion: { requerido: true, tipo: 'string', max: 255 },
            // cupoMaximo: { requerido: true, tipo: 'number', min: 1 },
            // estado: { requerido: false, tipo: 'enum', valores: ['activa', 'cancelada', 'finalizada'] }
        }
    },
    rol: {
        campos: {
            nombre: { requerido: true, tipo: 'string', min: 3, max: 50 },
            descripcion: { requerido: false, tipo: 'string', max: 255 },
            permisos: { requerido: false, tipo: 'string' }
        }
    },
    inscripcion: {
        campos: {
            idUsuario: { requerido: true, tipo: 'number', min: 1 },
            idActividad: { requerido: true, tipo: 'number', min: 1 },
            estado: { requerido: false, tipo: 'enum', valores: ['pendiente', 'confirmada', 'cancelada'] },
            comentarios: { requerido: false, tipo: 'string', max: 500 }
        }
    }
};

/**
 * Middleware de validación universal
 * @param {string} entidad - Nombre de la entidad a validar (usuario, actividad, rol, etc.)
 * @returns {Function} Middleware de Express
 */
export const validarCampos = (entidad) => {
    return (req, res, next) => {
        const { body, method } = req;
        const esquema = esquemas[entidad];

        // Verificar si existe el esquema para la entidad
        if (!esquema) {
            return res.status(500).json({
                ok: false,
                msg: `No existe esquema de validación para la entidad: ${entidad}`
            });
        }

        // Para POST: validar todos los campos requeridos
        if (method === 'POST') {
            const errores = validarTodosCampos(body, esquema.campos, true);
            if (errores.length > 0) {
                return res.status(400).json({
                    ok: false,
                    msg: 'Errores de validación',
                    errores
                });
            }
        }

        // Para PUT/PATCH: validar solo los campos que vienen en el body
        if (method === 'PUT' || method === 'PATCH') {
            const errores = validarTodosCampos(body, esquema.campos, false);
            if (errores.length > 0) {
                return res.status(400).json({
                    ok: false,
                    msg: 'Errores de validación',
                    errores
                });
            }
        }

        next();
    };
};

/**
 * Valida todos los campos según el esquema
 */
const validarTodosCampos = (data, campos, validarRequeridos) => {
    const errores = [];

    for (const [nombreCampo, reglas] of Object.entries(campos)) {
        const valor = data[nombreCampo];

        // Validar campos requeridos (solo en POST)
        if (validarRequeridos && reglas.requerido) {
            if (valor === undefined || valor === null || valor === '') {
                errores.push(`El campo '${nombreCampo}' es obligatorio`);
                continue;
            }
        }

        // Si el campo no viene en el body y no es requerido, saltarlo
        if (valor === undefined || valor === null) {
            continue;
        }

        // Validar según el tipo
        switch (reglas.tipo) {
            case 'string':
                const errorString = validarString(nombreCampo, valor, reglas);
                if (errorString) errores.push(errorString);
                break;

            case 'number':
                const errorNumber = validarNumber(nombreCampo, valor, reglas);
                if (errorNumber) errores.push(errorNumber);
                break;

            case 'email':
                const errorEmail = validarEmail(nombreCampo, valor);
                if (errorEmail) errores.push(errorEmail);
                break;

            case 'date':
                const errorDate = validarDate(nombreCampo, valor);
                if (errorDate) errores.push(errorDate);
                break;

            case 'enum':
                const errorEnum = validarEnum(nombreCampo, valor, reglas.valores);
                if (errorEnum) errores.push(errorEnum);
                break;

            case 'boolean':
                const errorBoolean = validarBoolean(nombreCampo, valor);
                if (errorBoolean) errores.push(errorBoolean);
                break;
        }
    }

    return errores;
};

// Validaciones específicas por tipo
const validarString = (campo, valor, reglas) => {
    if (typeof valor !== 'string') {
        return `El campo '${campo}' debe ser un texto`;
    }

    const valorTrim = valor.trim();

    if (valorTrim === '') {
        return `El campo '${campo}' no puede estar vacío`;
    }

    if (reglas.min && valorTrim.length < reglas.min) {
        return `El campo '${campo}' debe tener al menos ${reglas.min} caracteres`;
    }

    if (reglas.max && valorTrim.length > reglas.max) {
        return `El campo '${campo}' no puede tener más de ${reglas.max} caracteres`;
    }

    return null;
};

const validarNumber = (campo, valor, reglas) => {
    const numero = Number(valor);

    if (isNaN(numero)) {
        return `El campo '${campo}' debe ser un número válido`;
    }

    if (reglas.min !== undefined && numero < reglas.min) {
        return `El campo '${campo}' debe ser mayor o igual a ${reglas.min}`;
    }

    if (reglas.max !== undefined && numero > reglas.max) {
        return `El campo '${campo}' debe ser menor o igual a ${reglas.max}`;
    }

    return null;
};

const validarEmail = (campo, valor) => {
    if (typeof valor !== 'string') {
        return `El campo '${campo}' debe ser un texto`;
    }

    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(valor)) {
        return `El campo '${campo}' debe ser un email válido`;
    }

    return null;
};

const validarDate = (campo, valor) => {
    const fecha = new Date(valor);

    if (isNaN(fecha.getTime())) {
        return `El campo '${campo}' debe ser una fecha válida (formato: YYYY-MM-DD)`;
    }

    return null;
};

const validarEnum = (campo, valor, valoresPermitidos) => {
    if (!valoresPermitidos.includes(valor)) {
        return `El campo '${campo}' debe ser uno de: ${valoresPermitidos.join(', ')}`;
    }

    return null;
};

const validarBoolean = (campo, valor) => {
    if (typeof valor !== 'boolean' && valor !== 'true' && valor !== 'false' && valor !== 0 && valor !== 1) {
        return `El campo '${campo}' debe ser verdadero o falso`;
    }

    return null;
};

/**
 * Función helper para agregar nuevos esquemas dinámicamente
 */
// export const agregarEsquema = (entidad, campos) => {
//     esquemas[entidad] = { campos };
// };

/**
 * Función helper para obtener un esquema
 */
// export const obtenerEsquema = (entidad) => {
//     return esquemas[entidad];
// };

/**
 * Validación personalizada para casos específicos
 */
// export const validarCustom = (validaciones) => {
//     return (req, res, next) => {
//         const errores = [];

//         for (const validacion of validaciones) {
//             const error = validacion(req.body);
//             if (error) {
//                 errores.push(error);
//             }
//         }

//         if (errores.length > 0) {
//             return res.status(400).json({
//                 ok: false,
//                 msg: 'Errores de validación',
//                 errores
//             });
//         }

//         next();
//     };
// };

// Exportar esquemas para que puedan ser modificados externamente
export { esquemas };