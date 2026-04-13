# 🚀 GUÍA COMPLETA: DEPLOY EN RENDER

## ✅ PASO 1: Preparación Local (YA COMPLETADO)

✓ Configuración de CORS dinámica
✓ Variables de entorno configuradas
✓ Frontend y backend listos para producción
✓ Archivos .env.local y .env.production creados

---

## ✅ PASO 2: GitHub - Subir tu proyecto

### 2.1 Inicializar Git (si no está inicializado)
```bash
cd e:\app-web-sirpar\app-web-sirpar
git init
git add .
git commit -m "Initial commit - SIRPAR project ready for deployment"
```

### 2.2 Crear repositorio en GitHub
1. Ve a https://github.com/new
2. Nombre: `app-web-sirpar`
3. Descripción: "SIRPAR - Sistema de Reportes Ambientales"
4. Selecciona **Private** (recomendado)
5. Click "Create repository"

### 2.3 Conectar y subir a GitHub
```bash
git remote add origin https://github.com/TU_USUARIO/app-web-sirpar.git
git branch -M main
git push -u origin main
```

---

## ✅ PASO 3: MongoDB Atlas (GRATIS con límite)

### 3.1 Crear cuenta
- Ir a: https://www.mongodb.com/cloud/atlas
- Sign Up → Email y contraseña

### 3.2 Crear Cluster
- Click "Create Deployment"
- Selecciona "M0 Free" (512 MB gratuito)
- Región: Elige la más cercana a tu usuario
- Click "Create Deployment"

### 3.3 Usuario de BD
- Security → Database Access
- Click "Add New Database User"
- Username: `sirpar_user`
- Password: **GENERA UNA CONTRASEÑA FUERTE** ⚠️
- Click "Add User"

### 3.4 Acceso desde cualquier IP
- Network Access
- "Add IP Address" → "Allow access from anywhere" (0.0.0.0/0)
- Confirm

### 3.5 Obtener Connection String
- Databases → Tu cluster
- Click "Connect" → "Drivers"
- Copia la URL que aparece:
```
mongodb+srv://sirpar_user:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

**IMPORTANTE:** Reemplaza `PASSWORD` con tu contraseña real

**COPIA ESTO, LO NECESITARÁS EN RENDER**

---

## ✅ PASO 4: Render - Deploy de tu App

### 4.1 Crear cuenta en Render
- Ve a: https://render.com
- Sign Up con GitHub (recomendado) o email
- Autoriza a Render para acceder a tus repositorios

### 4.2 Crear nuevo Web Service
1. Click "New +" → "Web Service"
2. Conéctate con GitHub
3. Autoriza a Render
4. Selecciona tu repositorio `app-web-sirpar`
5. Click "Connect"

### 4.3 Configurar el Web Service

**Nombre:** `sirpar-backend`

**Ambiente:** `Node`

**Build Command (IMPORTANTE):**
```bash
npm install && npm run build && cd backend && npm install
```

**Start Command:**
```bash
NODE_ENV=production npm start --prefix backend
```

### 4.4 Agregar Variables de Entorno

Haz click en "Advanced" y luego en "Add Environment Variable"

Agrega estas variables:

| Variable | Valor |
|---|---|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | `mongodb+srv://sirpar_user:TU_PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority` |
| `PORT` | `5000` |
| `FRONTEND_URL` | `https://sirpar-backend.onrender.com` (se actualizará después) |

⚠️ **REEMPLAZA:**
- `TU_PASSWORD` con tu contraseña de MongoDB
- `cluster0.xxxxx` con tu cluster URL real

### 4.5 Deploy

Click en "Create Web Service"

**ESPERA 5-10 minutos mientras se deploy**

Verás un log como:
```
🚀 Servidor SIRPAR iniciado
📍 URL: https://sirpar-backend.onrender.com
🔗 MongoDB: Conectado
```

---

## ✅ PASO 5: Actualizar URLs después del Deploy

### 5.1 Copiar tu URL de Render
Una vez que Render termine, tendrás una URL como:
```
https://sirpar-backend.onrender.com
```

### 5.2 Actualizar variables
1. En Render, ve a Settings de tu Web Service
2. Modifica `FRONTEND_URL` con tu URL real

### 5.3 Actualizar en GitHub
En tu máquina local:
```bash
# Actualizar .env.production
echo "VITE_API_URL=https://sirpar-backend.onrender.com/api" > .env.production

# Subir cambios
git add .env.production
git commit -m "Update API URL for production"
git push
```

Render hará auto-deploy automáticamente.

---

## ✅ PASO 6: Probar tu App

Accede a: `https://sirpar-backend.onrender.com`

Deberías ver tu app funcionando.

**Pruebas finales:**
- [ ] Puedes registrarte
- [ ] Puedes loguearte
- [ ] Puedes crear reportes
- [ ] Puedes ver el mapa
- [ ] Los datos se guardan en MongoDB

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### Error: "Cannot find module 'dotenv'"
```bash
cd backend
npm install
cd ..
```

### Error: "MongoDB Connection Failed"
- Verifica que la contraseña en `MONGODB_URI` sea correcta
- Verifica que 0.0.0.0/0 esté permitido en MongoDB Atlas
- Verifica que `MONGODB_URI` tenga `/?retryWrites=true&w=majority` al final

### Error: "CORS error"
- Verifica que `FRONTEND_URL` esté configurado correctamente
- Verifica que en `backend/server.js` el CORS esté habilitado

### La app se carga pero no conecta al backend
- Abre DevTools (F12)
- Ve a Console
- Deberías ver logs del fetch a tu API
- Verifica que `VITE_API_URL` sea correcto en `.env.production`

---

## 📊 Límites Gratuitos

| Servicio | Límite Gratuito |
|---|---|
| **Render Web Service** | 750 horas/mes (suficiente para 1 app) |
| **MongoDB Atlas** | 512 MB almacenamiento |
| **Bandwidth** | Ilimitado |
| **Reintentos** | Después de 15 min inactividad en Render |

---

## ✨ PRÓXIMOS PASOS (Opcional)

1. **Custom Domain** - Compra un dominio en Namecheap y conéctalo a Render
2. **SSL Certificate** - Render lo proporciona gratis
3. **Backups de MongoDB** - Configura en Atlas
4. **Monitoreo** - Usa Render's analytics

---

💡 **¿PREGUNTAS?** Si algo no funciona, verifica los logs en Render (click en "Logs")
