import('dotenv').config();
const path = import('path');

const express = import('express');
const cors = import('cors');

const { dbConnection } = import('./database/config');


// Crear el servidor de express
const app = express();

// Configurar CORS
app.use( cors() );

// Lectura y parseo del body
app.use( express.json() );

// Base de datos
dbConnection();

// Directorio público
app.use( express.static('public') );

// Rutas
app.use( '/api/usuarios', import('./src/routes/usuarios') );
app.use( '/api/hospitales', import('./src/routes/hospitales') );
app.use( '/api/medicos', import('./src/routes/medicos') );
app.use( '/api/todo', import('./src/routes/busquedas') );
app.use( '/api/login', import('./src/routes/auth') );
app.use( '/api/upload', import('./src/routes/uploads') );

// Lo último
app.get('*', (req, res) => {
    res.sendFile( path.resolve( __dirname, 'public/index.html' ) );
});


app.listen( process.env.PORT, () => {
    console.log('Servidor corriendo en puerto ' + process.env.PORT );
});

