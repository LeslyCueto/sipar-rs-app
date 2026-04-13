const express = require('express');
const https = require('https');
const router = express.Router();

// ⭐ CACHÉ mejorado con mejor management
const cache = new Map();
const MAX_CACHE = 500; // Aumentado a 500 entradas
const CACHE_TTL = 7200000; // 2 horas (fue 1 hora)

// Sistema de cola para evitar request spam
let requestQueue = [];
let isProcessingQueue = false;
const QUEUE_DELAY = 200; // 200ms entre requests a Nominatim (más generoso que 1s)

// Procesar la cola de requests
const processQueue = async () => {
  if (isProcessingQueue || requestQueue.length === 0) return;
  
  isProcessingQueue = true;
  const request = requestQueue.shift();
  
  try {
    await request.execute();
  } catch (err) {
    console.error('Error procesando request de cola:', err.message);
  }
  
  // Esperar QUEUE_DELAY antes de procesar el siguiente
  setTimeout(() => {
    isProcessingQueue = false;
    processQueue();
  }, QUEUE_DELAY);
};

// Función auxiliar para hacer requests HTTP(S) con cola
const makeRequest = (url) => {
  return new Promise((resolve, reject) => {
    const request = {
      execute: () => makeRequestNow(url, resolve, reject)
    };
    
    requestQueue.push(request);
    processQueue();
  });
};

const makeRequestNow = (url, resolve, reject) => {
  https.get(url, {
    headers: {
      'Accept-Language': 'es',
      'User-Agent': 'SIRPAR-App/1.0 (+https://sirpar.example.com)',
      'Referer': 'http://localhost:5173/',
    },
    timeout: 5000,
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        resolve({ status: res.statusCode, data: parsed });
      } catch (e) {
        resolve({ status: res.statusCode, data: {} });
      }
    });
  }).on('error', (err) => {
    console.error('Request error:', err.message);
    reject(err);
  }).on('timeout', () => {
    reject(new Error('Request timeout'));
  });
};

// Endpoint proxy para obtener sugerencias de direcciones desde Nominatim
router.get('/search', async (req, res) => {
  const { q, countrycodes = 'pe', limit = 5 } = req.query;

  if (!q || q.trim().length < 3) {
    return res.json([]);
  }

  const cacheKey = `search_${q.trim().toLowerCase()}_${countrycodes}_${limit}`;

  // Verificar caché PRIMERO
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`✅ CACHÉ HIT: ${q}`);
      return res.json(cached.data);
    } else {
      cache.delete(cacheKey);
    }
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=${countrycodes}&limit=${limit}&addressdetails=1`;
    
    console.log(`🔍 Buscando en Nominatim: ${q}`);
    const { status, data } = await makeRequest(url);

    if (status !== 200) {
      console.warn(`⚠️ Nominatim HTTP ${status} para: ${q}`);
      // Retornar array vacío en lugar de error
      return res.json([]);
    }

    // Guardar en caché (size management)
    if (cache.size >= MAX_CACHE) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    cache.set(cacheKey, { data, timestamp: Date.now() });
    
    console.log(`✅ Encontradas ${data.length || 0} sugerencias para: ${q}`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error en búsqueda de ubicaciones:', error.message);
    // Retornar array vacío en lugar de error
    res.json([]);
  }
});

// Endpoint para geocodificación inversa (coordenadas a dirección)
router.get('/reverse', async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Coordenadas requeridas' });
  }

  const cacheKey = `reverse_${parseFloat(lat).toFixed(6)}_${parseFloat(lon).toFixed(6)}`;

  // Verificar caché PRIMERO - pero solo si tiene display_name válido
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL && cached.data.display_name && !cached.data.display_name.startsWith('Coordenadas:')) {
      console.log(`✅ CACHÉ HIT REVERSE: (${lat}, ${lon}) => ${cached.data.display_name.substring(0, 50)}...`);
      return res.json(cached.data);
    } else {
      console.warn(`⚠️ Caché corrupto para (${lat}, ${lon}), borrando...`);
      cache.delete(cacheKey);
    }
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
    
    console.log(`🔍 Reverse geocode: (${lat}, ${lon})`);
    const { status, data } = await makeRequest(url);

    console.log(`📦 Respuesta de Nominatim (status ${status}):`, {
      display_name: data.display_name?.substring(0, 100),
      address: data.address ? Object.keys(data.address) : 'sin address',
    });

    if (status !== 200 || !data.display_name) {
      console.warn(`⚠️ Nominatim reverse HTTP ${status} o sin display_name`);
      // Retornar un objeto vacío con las coordenadas
      return res.json({ 
        lat: lat,
        lon: lon,
        display_name: `Coordenadas: ${parseFloat(lat).toFixed(4)}, ${parseFloat(lon).toFixed(4)}`
      });
    }

    // VALIDAR que el display_name sea válido (no sea solo coordenadas)
    if (data.display_name.startsWith('Coordenadas:')) {
      console.warn(`⚠️ display_name inválido (es solo coordenadas): ${data.display_name}`);
      return res.json({
        lat: lat,
        lon: lon,
        display_name: `Coordenadas: ${parseFloat(lat).toFixed(4)}, ${parseFloat(lon).toFixed(4)}`
      });
    }

    // Guardar en caché (size management)
    if (cache.size >= MAX_CACHE) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    cache.set(cacheKey, { data, timestamp: Date.now() });

    console.log(`✅ Reverse geocoding exitoso para (${lat}, ${lon}): ${data.display_name.substring(0, 100)}`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error en reverse geocoding:', error.message);
    // Retornar un objeto con fallback a coordenadas
    res.json({ 
      lat: lat,
      lon: lon,
      display_name: `Coordenadas: ${parseFloat(lat).toFixed(4)}, ${parseFloat(lon).toFixed(4)}`
    });
  }
});

// Endpoint para limpiar el caché (debug)
router.get('/cache/clear', (req, res) => {
  const sizeBefore = cache.size;
  cache.clear();
  console.log(`♻️  Caché limpiado: ${sizeBefore} entradas eliminadas`);
  res.json({ message: 'Caché limpiado', entriesCleaned: sizeBefore });
});

module.exports = router;


