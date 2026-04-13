# ✅ CHECKLIST PRE-DEPLOY

## 🔍 Verificación Local

- [ ] `npm install` en la raíz se ejecuta sin errores
- [ ] `npm run build` genera la carpeta `dist/`
- [ ] `cd backend && npm install` funciona
- [ ] Los archivos `.env` están creados:
  - [ ] `.env.local` existe (con VITE_API_URL=http://localhost:5000/api)
  - [ ] `.env.production` existe
  - [ ] `backend/.env.example` existe

## 📁 Estructura Correcta

- [ ] `Procfile` existe en la raíz
- [ ] `build.sh` existe en la raíz
- [ ] `DEPLOY_RENDER.md` existe en la raíz
- [ ] `dist/` existe (resultado de npm run build)

## 🔐 Seguridad

- [ ] `.gitignore` incluye `.env` y `backend/.env`
- [ ] NUNCA subas credenciales reales a GitHub
- [ ] Usa variables de entorno en Render en lugar de valores hardcodeados

## 📝 Código Listo

- [ ] `backend/server.js` tiene:
  - [ ] CORS dinámico configurado
  - [ ] Manejo de archivos estáticos del dist/
  - [ ] Path require para archivos estáticos

- [ ] `src/utils/api.ts` usa:
  - [ ] `import.meta.env.VITE_API_URL` para la URL del backend

## 🌐 GitHub

- [ ] Repositorio creado
- [ ] Todos los cambios commitados
- [ ] Push completado a main
- [ ] Repositorio visible en github.com/TU_USUARIO/app-web-sirpar

## 🗄️ MongoDB Atlas

- [ ] Cluster creado (M0 Free)
- [ ] Usuario `sirpar_user` creado con contraseña fuerte
- [ ] 0.0.0.0/0 permitido en Network Access
- [ ] Connection String copiada y guardada

## 🚀 Render

- [ ] Cuenta creada en render.com
- [ ] Web Service creado
- [ ] Build Command configurado correctamente
- [ ] Start Command configurado correctamente
- [ ] TODAS las variables de entorno agregadas
- [ ] Deploy iniciado y esperando resultado

## ✨ Después del Deploy

- [ ] Copiar URL de Render (ej: https://sirpar-backend.onrender.com)
- [ ] Actualizar FRONTEND_URL en Render
- [ ] Probar acceso a https://sirpar-backend.onrender.com
- [ ] Probar login/registro
- [ ] Verificar que los datos se guardan en MongoDB

---

**ERROR FRECUENTE:** Si falla, mira los LOGS en Render (es lo primero a revisar)
