import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'SistemaVoluntariado',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export const dbConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Base de datos conectada correctamente');
        connection.release();
    } catch (error) {
        console.error('❌ Error al conectar a la base de datos:', error);
        throw new Error('Error en la conexión a la base de datos');
    }
};

export default pool;