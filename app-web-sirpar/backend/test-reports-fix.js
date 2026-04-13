#!/usr/bin/env node

/**
 * Script de test para verificar que el endpoint de reportes funciona
 * Uso: node test-reports-fix.js
 * 
 * Esto:
 * 1. Lee un token de un usuario existente o crea uno
 * 2. Envía un reporte de prueba
 * 3. Verifica que se guardó en MongoDB
 */

const http = require('http');

// Función para hacer request HTTP
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : null;
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function test() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  🧪 Test del Endpoint de Reportes    ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    // Test 1: Verificar que el backend está corriendo
    console.log('1️⃣  Verificando que el backend está activo...');
    const testRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/test',
      method: 'GET',
    });

    if (testRes.status === 200) {
      console.log('   ✅ Backend activo correctamente\n');
    } else {
      console.log(`   ❌ Backend no responde correctamente (${testRes.status})\n`);
      return;
    }

    // Test 2: Registrar usuario de prueba
    console.log('2️⃣  Registrando usuario de prueba...');
    const userData = {
      nombreCompleto: `Test User ${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      password: '123456',
      telefono: '1234567890',
      ubicacion: 'Lima',
    };

    const registerRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/registro',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, userData);

    if (registerRes.status !== 201) {
      console.log(`   ❌ Error en registro (${registerRes.status})`);
      console.log('   Respuesta:', registerRes.body);
      return;
    }

    const token = registerRes.body.token;
    console.log(`   ✅ Usuario registrado: ${userData.email}\n`);

    // Test 3: Enviar reporte de prueba
    console.log('3️⃣  Enviando reporte de prueba...');
    const reportData = {
      anonimo: false,
      tipoIncidente: 'quema_ilegal',
      descripcion: 'Prueba de reporte automático',
      imagenes: [
        {
          url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          nombre: 'test-image.png',
          tipo: 'capturada',
          fecha: new Date().toISOString(),
        }
      ],
      ubicacion: {
        departamento: 'LIMA',
        provincia: 'LIMA',
        distrito: 'LIMA',
        coordenadas: {
          lat: -12.046,
          lng: -77.0428,
        },
        ubigeo: '150131',
      },
      nivelPercibido: 'alto',
      nivelFinal: null,
      estado: 'pendiente',
      fechas: {
        creado: new Date().toISOString(),
        resuelto: null,
      },
    };

    const reportRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/reports',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }, reportData);

    if (reportRes.status !== 201) {
      console.log(`   ❌ Error al crear reporte (${reportRes.status})`);
      console.log('   Respuesta:', reportRes.body);
      return;
    }

    const reportId = reportRes.body.reporte._id;
    console.log(`   ✅ Reporte creado: ${reportId}\n`);

    // Test 4: Obtener los reportes del usuario
    console.log('4️⃣  Obteniendo reportes del usuario...');
    const getRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/reports',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (getRes.status !== 200) {
      console.log(`   ❌ Error al obtener reportes (${getRes.status})`);
      console.log('   Respuesta:', getRes.body);
      return;
    }

    const reportCount = getRes.body.reportes?.length || 0;
    console.log(`   ✅ Reportes encontrados: ${reportCount}\n`);

    // Test 5: Verificar estructura del reporte
    console.log('5️⃣  Verificando estructura del reporte...');
    const savedReport = getRes.body.reportes?.[0];
    
    if (!savedReport) {
      console.log('   ❌ No se encontró reporte guardado');
      return;
    }

    const checks = [
      { name: 'ID', value: savedReport._id, expected: reportId },
      { name: 'Tipo Incidente', value: savedReport.tipoIncidente, expected: 'quema_ilegal' },
      { name: 'Nivel Percibido', value: savedReport.nivelPercibido, expected: 'alto' },
      { name: 'Usuario', value: savedReport.usuario.email, expected: userData.email },
      { name: 'Imagenes', value: savedReport.imagenes?.length, expected: 1 },
    ];

    let allOk = true;
    checks.forEach(check => {
      const ok = check.value === check.expected;
      const status = ok ? '✅' : '❌';
      console.log(`   ${status} ${check.name}: ${check.value}`);
      if (!ok) allOk = false;
    });

    if (allOk) {
      console.log('\n╔════════════════════════════════════════╗');
      console.log('║        ✅ TODOS LOS TESTS PASARON     ║');
      console.log('╚════════════════════════════════════════╝\n');
    } else {
      console.log('\n⚠️  Algunos datos no coinciden\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
