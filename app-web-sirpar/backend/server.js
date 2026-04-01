require('dotenv').config({ path: `${__dirname}/.env` });
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

// Conectar a MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Puerto de Vite
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reports', require('./routes/reports'));

// Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({ mensaje: '✅ Backend funcionando correctamente' });
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ success: false, mensaje: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════╗
  ║  🚀 Servidor SIRPAR iniciado       ║
  ║  📍 URL: http://localhost:${PORT}    ║
  ║  🔗 MongoDB: Conectado            ║
  ╚════════════════════════════════════╝
  `);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('❌ Error no manejado:', err);
  server.close(() => process.exit(1));
});
