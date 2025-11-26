const mysql = require('mysql2');

// Crear la conexión
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',           // tu usuario de MySQL
  password: '',           // tu contraseña de MySQL
  database: 'voluntariado'
});

// Conectar
connection.connect((error: any) => {
  if (error) {
    console.error('Error conectando a la base de datos:', error);
    return;
  }
  console.log('Conectado a la base de datos MySQL');
});

module.exports = connection;