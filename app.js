const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = 3000;

// Configuración de la conexión a PostgreSQL usando las variables de entorno de Docker
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Middleware para leer datos de formularios POST
app.use(express.urlencoded({ extended: true }));

// Función para inicializar la base de datos (crear tabla)
async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Tabla 'usuarios' verificada/creada correctamente.");
  } catch (err) {
    console.error("Error al inicializar la base de datos:", err);
  }
}

initDb();

// Ruta principal: Muestra el formulario y la lista de usuarios guardados
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usuarios ORDER BY id DESC');
    const usuarios = result.rows;

    let html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Prueba Docker Node + Postgres</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; background: #f4f4f9; color: #333; }
          .container { max-width: 600px; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          input { display: block; width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
          button { background: #007bff; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
          button:hover { background: #0056b3; }
          table { width: 100%; margin-top: 20px; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Registro de Usuarios (Docker + Postgres)</h2>
          <form action="/agregar" method="POST">
            <label>Nombre:</label>
            <input type="text" name="nombre" required placeholder="Ej. Juan Pérez">
            <label>Correo Electrónico:</label>
            <input type="email" name="email" required placeholder="Ej. juan@mail.com">
            <button type="submit">Guardar en Base de Datos</button>
          </form>

          <h3>Usuarios Registrados:</h3>
          <table>
            <tr><th>ID</th><th>Nombre</th><th>Email</th><th>Fecha</th></tr>
    `;

    usuarios.forEach(u => {
      html += `<tr><td>${u.id}</td><td>${u.nombre}</td><td>${u.email}</td><td>${new Date(u.fecha_creacion).toLocaleString()}</td></tr>`;
    });

    html += `
          </table>
        </div>
      </body>
      </html>
    `;

    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al consultar la base de datos");
  }
});

// Ruta para procesar el formulario y guardar en Postgres
app.post('/agregar', async (req, res) => {
  const { nombre, email } = req.body;
  try {
    await pool.query('INSERT INTO usuarios (nombre, email) VALUES ($1, $2)', [nombre, email]);
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.send(`Error al guardar (¿El correo ya existe?): <a href="/">Volver</a>`);
  }
});

app.listen(port, () => {
  console.log(`Aplicación web corriendo en http://localhost:${port}`);
});