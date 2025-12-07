# 🧩 backend del sistema de voluntariado

## Descripcion el sistema: 
este es un proyecto en el se gestiona el voluntariado de una institucion. 

## requerimientos: 
* mysql
* nodeJS (instalara NPM de forma automatica)

## para levantar el proyecto de forma local
abrir una terminal en la raiz del proyecto, correr el siguiente comando:

``` bash
npm install
```
> **📝 Nota:**  Esto descargara todas las dependencias nesesarias para correr el proyecto

> **💡TIP:**
> Puedes usar visual estudio code para abrir el proyecto, despues presiona `control + j` para abrir el terminal. Luego ejecuta el comando de arriba. 

## pasos para probar el funcionamiento del backend 
1.  correr los scrips de la carpeta schema antes de hacer el deploy de la api 
> **📝 Nota:**  Ten en cuenta que hay un archivo que crea el primer usuario del sistema, dicho archivo se llama en el `index.js`, demodo que se crea automaticamente el primer usuario. 
```txt
ORDEN CORRECTO:
1. usuario          (independiente)
2. Cargo            (independiente)
3. GrupoVoluntariado (independiente)
4. Actividad        (depende de: GrupoVoluntariado)
5. GrupoVoluntariado_Usuario (depende de: GrupoVoluntariado, usuario, Cargo)
6. Actividad_Usuario (depende de: Actividad, usuario)
7. Certificado      (depende de: GrupoVoluntariado, usuario)

REGLA GENERAL:
- Primero crear las tablas que no tienen claves foráneas
- Luego crear las tablas que dependen de las anteriores
- Las tablas intermedias (muchos a muchos) se crean al final
```

2.  para correr de forma local la api, abrir un terminal en la raiz del proyecto y ejecutar el comando `npm start`   
3.  
4.  
5.  

## Formato del número de certificado auto-generado:
```txt
CERT-2024-0001-000002-1234
     │    │     │      └─ Número aleatorio
     │    │     └─ ID Usuario (6 dígitos)
     │    └─ ID Grupo (4 dígitos)
     └─ Año actual
```

## El código YA está protegido contra SQL Injection 🛡️
¿Por qué? Porque usas procedimientos almacenados con parámetros preparados:
``` bash
✅ ESTO ESTÁ SEGURO
await pool.query(
    'CALL sp_Cargo_CRUD(?, ?, ?, ?, ?)',
    ['INSERT', nombreCargo, descripcion, fecha]
);

Los ? son placeholders que MySQL escapa automáticamente, previniendo SQL Injection.
```
## estructura de archivos
```txt
backend/
│
├── src/
│   ├── config/
│   │   ├── database.js          # Configuración de conexión a BD
│   │   ├── environment.js       # Variables de entorno
│   │   └── swagger.js           # Configuración de documentación API
│   │
│   ├── models/
│   │   ├── Usuario.js           # Modelo de Usuario
│   │   ├── Actividad.js         # Modelo de Actividad
│   │   ├── JuntaVoluntariado.js # Modelo de Junta Voluntariado
│   │   ├── GrupoVoluntariado.js # Modelo de Grupo Voluntariado
│   │   ├── UsuarioJuntaVol.js   # Modelo relación Usuario-Junta
│   │   ├── Rol.js               # Modelo de Rol
│   │   └── Certificado.js       # Modelo de Certificado
│   │
│   ├── controllers/
│   │   ├── usuarioController.js        # Lógica de negocio de usuarios
│   │   ├── actividadController.js      # CRUD y lógica de actividades
│   │   ├── juntaController.js          # Gestión de juntas
│   │   ├── grupoController.js          # Gestión de grupos
│   │   ├── inscripcionController.js    # Inscripciones usuario-junta
│   │   ├── rolController.js            # Gestión de roles
│   │   ├── certificadoController.js    # Generación y gestión de certificados
│   │   └── authController.js           # Autenticación y autorización
│   │
│   ├── routes/
│   │   ├── usuarioRoutes.js     # Rutas de usuarios
│   │   ├── actividadRoutes.js   # Rutas de actividades
│   │   ├── juntaRoutes.js       # Rutas de juntas
│   │   ├── grupoRoutes.js       # Rutas de grupos
│   │   ├── inscripcionRoutes.js # Rutas de inscripciones
│   │   ├── rolRoutes.js         # Rutas de roles
│   │   ├── certificadoRoutes.js # Rutas de certificados
│   │   ├── authRoutes.js        # Rutas de autenticación
│   │   └── index.js             # Centralizador de rutas
│   │
│   ├── middlewares/
│   │   ├── authMiddleware.js    # Verificación de JWT
│   │   ├── roleMiddleware.js    # Validación de permisos por rol
│   │   ├── validationMiddleware.js # Validación de datos de entrada
│   │   ├── errorHandler.js      # Manejo centralizado de errores
│   │   └── uploadMiddleware.js  # Manejo de archivos subidos
│   │
│   ├── services/
│   │   ├── emailService.js      # Envío de correos electrónicos
│   │   ├── pdfService.js        # Generación de certificados PDF
│   │   ├── authService.js       # Lógica de autenticación
│   │   └── notificationService.js # Notificaciones del sistema
│   │
│   ├── utils/
│   │   ├── validator.js         # Funciones de validación
│   │   ├── dateHelper.js        # Helpers para fechas
│   │   ├── responseHandler.js   # Estandarización de respuestas
│   │   └── constants.js         # Constantes del sistema
│   │
│   ├── database/
│   │   ├── migrations/          # Scripts de migración de BD
│   │   └── seeders/             # Datos iniciales para BD
│   │
│   └── app.js                   # Configuración principal de Express
│
├── tests/
│   ├── unit/                    # Tests unitarios
│   └── integration/             # Tests de integración
│
├── .env                         # Variables de entorno
├── .env.example                 # Ejemplo de variables de entorno
├── .gitignore                   # Archivos ignorados por Git
├── package.json                 # Dependencias y scripts
└── server.js                    # Punto de entrada de la aplicación
```

## vdfv