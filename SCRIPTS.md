#!/bin/bash

# ===========================
# SCRIPTS ÚTILES - PWA APP
# ===========================

# Para ejecutar en Windows (PowerShell):
# ./scripts.ps1

# Para ejecutar en macOS/Linux:
# chmod +x scripts.sh
# ./scripts.sh

echo "===== Scripts Disponibles ====="
echo "1. npm install          - Instalar dependencias"
echo "2. npm run dev          - Iniciar en desarrollo"
echo "3. npm start            - Iniciar en producción"
echo "4. npm test             - Ejecutar tests"
echo "5. npm run build        - Compilar proyecto"
echo ""
echo "===== Comandos Útiles ====="
echo ""
echo "Limpiar caché de npm:"
echo "npm cache clean --force"
echo ""
echo "Actualizar dependencias:"
echo "npm update"
echo ""
echo "Ver vulnerabilidades:"
echo "npm audit"
echo "npm audit fix"
echo ""
echo "Instalar una dependencia específica:"
echo "npm install nombre-paquete"
echo ""
echo "Desinstalar una dependencia:"
echo "npm uninstall nombre-paquete"
echo ""
echo "===== Desarrollo ====="
echo ""
echo "Para ver logs en tiempo real:"
echo "npm run dev"
echo ""
echo "Para detener: Ctrl + C"
echo ""
echo "Para limpiar localStorage en Consola:"
echo "localStorage.clear()"
echo ""
echo "===== PWA ====="
echo ""
echo "Para instalar como PWA (Chrome):"
echo "1. Abre http://localhost:3000"
echo "2. Click en icono de instalación"
echo "3. Confirma"
echo ""
echo "Para ver Service Worker:"
echo "DevTools → Application → Service Workers"
echo ""
echo "Para ver Manifest:"
echo "DevTools → Application → Manifest"
echo ""
echo "===== Desplegar ====="
echo ""
echo "En Render.com:"
echo "Build Command: npm install"
echo "Start Command: npm start"
echo ""
