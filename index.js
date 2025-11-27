import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { dbConnection } from './src/config/database.js';
import crearUsuarioInicial from './src/database/setup.js';

// Rutas
import usuariosRoutes from './src/routes/usuarios.js';
import autenticacionRoutes from './src/routes/autenticacion.js';

// Configuración de __dirname para ES6
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config();

// Crear el servidor de express
const app = express();

// Configurar CORS
app.use(cors());

// Lectura y parseo del body
app.use(express.json());

// Función de inicialización
const iniciarServidor = async () => {
    try {
        // Conectar a la base de datos
        await dbConnection();
        
        // Crear usuario inicial si no existe
        await crearUsuarioInicial();

        // Directorio público
        app.use(express.static('public'));

        // Rutas de la API
        app.use('/api/usuarios', usuariosRoutes);
        app.use('/api/auth', autenticacionRoutes);

        // Ruta por defecto
        app.get('/', (req, res) => {
            res.sendFile(path.resolve(__dirname, 'public/index.html'));
        });

        // Iniciar servidor
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
            console.log(`🌐 http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

// Iniciar el servidor
iniciarServidor();