require('dotenv').config({ path: `${__dirname}/.env` });
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database');

// Conectar a MongoDB
connectDB();

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:5173', // Desarrollo local
  process.env.FRONTEND_URL || '', // Producción en Render
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend compilado (solo en producción)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
}

// Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/locations', require('./routes/locations'));

// Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({ mensaje: '✅ Backend funcionando correctamente' });
});

// Servir el frontend compilado para rutas no-API (React Router)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Manejo de errores 404 (solo en desarrollo)
app.use((req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  } else {
    res.status(404).json({ success: false, mensaje: 'Ruta no encontrada' });
  }
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
