#!/bin/bash

# Script para build en Render
echo "📦 Instalando dependencias del frontend..."
npm install

echo "🔨 Compilando frontend..."
npm run build

echo "📦 Instalando dependencias del backend..."
cd backend
npm install
cd ..

echo "✅ Build completado"
