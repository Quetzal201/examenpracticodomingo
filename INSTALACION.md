# Descargas e Instalaciones Necesarias

## ✅ Ya Completado (Archivos Creados)

### Backend
- ✅ `server.js` - Servidor Express configurado
- ✅ `database.js` - Conexión y queries para Turso
- ✅ `auth.js` - Autenticación JWT y bcrypt
- ✅ `routes.js` - Rutas API (login, registro, CRUD pedidos)

### Frontend
- ✅ `index.html` - SPA con modales
- ✅ `styles.css` - Dark mode completo, responsive, botones outline
- ✅ `app.js` - Lógica principal
- ✅ `ui.js` - Interfaz de usuario (login, tabla pedidos, modales)
- ✅ `api.js` - Cliente HTTP con manejo offline
- ✅ `auth.js` - Gestor de autenticación
- ✅ `utils.js` - Utilidades globales
- ✅ `offline-manager.js` - Gestor de tareas pendientes
- ✅ `sw.js` - Service Worker (cache, offline, sync)

### Configuración PWA
- ✅ `manifest.json` - Metadata para instalación
- ✅ `sw.js` - Service Worker registrado en index.html

### Configuración del Proyecto
- ✅ `package.json` - Dependencias configuradas
- ✅ `.env` - Variables de entorno
- ✅ `.gitignore` - Archivos ignorados

## 📥 Descargas/Instalaciones Necesarias

### 1. Node.js (Si no está instalado)
```bash
# Descargar desde: https://nodejs.org/
# Versión recomendada: LTS (18.x o superior)
# Después de instalar, verificar:
node --version
npm --version
```

### 2. Instalar Dependencias del Proyecto
```bash
cd c:\Users\Usuario\Documents\ProyectoReactNative9Cuatri\examenpracticodomingo
npm install
```

Esto instalará:
- `express` - Framework web
- `dotenv` - Variables de entorno
- `@libsql/client` - Cliente Turso
- `jsonwebtoken` - JWT
- `bcryptjs` - Hash de contraseñas
- `cors` - CORS middleware
- `nodemon` - Hot reload en desarrollo

### 3. Configurar Turso Database
```bash
# 1. Ir a https://turso.tech
# 2. Crear cuenta (gratis)
# 3. Crear una base de datos
# 4. Copiar:
#    - Database URL (TURSO_DATABASE_URL)
#    - Auth Token (TURSO_AUTH_TOKEN)
# 5. Pegar en .env
```

### 4. Generar JWT_SECRET
```bash
# En Windows PowerShell:
$env:RANDOM | ForEach-Object { [System.Random]::New().Next() }

# O generar online: https://generate-random.org/
# Debe tener mínimo 32 caracteres
```

### 5. Completar Variables de Entorno (.env)
```env
TURSO_DATABASE_URL=libsql://tu-db.turso.io
TURSO_AUTH_TOKEN=tu_token_aqui
PORT=3000
JWT_SECRET=tu_secret_de_32_caracteres_minimo
NODE_ENV=development
```

## 🖼️ Crear Iconos PWA (Opcional pero Recomendado)

Para que PWA funcione correctamente, necesitas crear 2 iconos PNG:

### Opción 1: Generar online (RECOMENDADO)
1. Ir a: https://www.favicon-generator.org/
2. Subir tu logo o crear uno simple
3. Descargar: `icon-192.png` y `icon-512.png`
4. Guardar en: `public/img/`

### Opción 2: Crear manualmente
```bash
# Con ImageMagick (si está instalado):
# Crear fondo: 192x192 y 512x512
# Guardar como PNG en public/img/
```

### Opción 3: Usar placeholders
Si quieres probar sin iconos (PWA funcionará):
- Los archivos se crearán con rutas vacías en manifest.json

## 🚀 Iniciar la Aplicación

### Desarrollo (con auto-reload)
```bash
npm run dev
```

### Producción
```bash
npm start
```

Acceder a: `http://localhost:3000`

## 📱 Probar PWA Localmente

### Activar HTTPS en localhost (Recomendado)
```bash
# Opción 1: Usar ngrok (túnel HTTPS)
# Descargar: https://ngrok.com/download
# Ejecutar en otra terminal:
ngrok http 3000

# Acceder a: https://tu-ngrok-url.ngrok.io
```

### En Chrome DevTools
1. Abirir DevTools (F12)
2. Ir a Application → Manifest
3. Verificar que manifest.json se carga correctamente
4. Ir a Application → Service Workers
5. Verificar que Service Worker esté registrado

### Instalar PWA
1. En la barra de dirección, debe aparecer un icono de instalación
2. Click en él
3. "Instalar" o "Agregar a aplicaciones"

## ✅ Checklist Final

- [ ] Node.js instalado (`node --version`)
- [ ] Dependencias instaladas (`npm install` completó sin errores)
- [ ] Cuenta Turso creada
- [ ] Variables .env completadas (TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, JWT_SECRET)
- [ ] `npm run dev` inicia sin errores en puerto 3000
- [ ] Página carga en `http://localhost:3000`
- [ ] Puedo registrarme
- [ ] Puedo iniciar sesión
- [ ] Puedo crear pedidos
- [ ] Puedo editar pedidos
- [ ] Puedo eliminar pedidos
- [ ] Service Worker está registrado
- [ ] PWA es instalable

## 🚀 Próximos Pasos: Desplegar en Render

### 1. Preparar GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU_USUARIO/examenpracticodomingo.git
git branch -M main
git push -u origin main
```

### 2. Configurar Render
1. Ir a: https://render.com
2. Conectar GitHub
3. Crear "New" → "Web Service"
4. Seleccionar repositorio
5. Configurar:
   - Name: `pwa-orders-app`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Free
6. Añadir variables de entorno:
   - TURSO_DATABASE_URL
   - TURSO_AUTH_TOKEN
   - JWT_SECRET
   - NODE_ENV=production

### 3. Deploy
- Hacer click en "Deploy"
- Esperar a que se complete
- La app estará disponible en: `https://pwa-orders-app.onrender.com`

## 📚 Recursos Adicionales

- [Node.js Docs](https://nodejs.org/en/docs/)
- [Express Docs](https://expressjs.com/)
- [Turso Docs](https://docs.turso.tech/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [JWT Intro](https://jwt.io/introduction)
- [PWA Checklist](https://web.dev/pwa-checklist/)

## 🆘 Soporte

Si algo no funciona:
1. Verifica los logs del servidor
2. Abre DevTools (F12)
3. Ve a Console para ver errores
4. Revisa Network para solicitudes API
5. Limpia localStorage: `localStorage.clear()`
