# Guía Rápida - Proyecto PWA Gestor de Pedidos

## 🚀 Iniciar en 5 Minutos

### Paso 1: Preparar el Entorno
```bash
# 1. Asegúrate de tener Node.js instalado
node --version  # debe ser 16+

# 2. Navega a la carpeta del proyecto
cd examenpracticodomingo

# 3. Instala las dependencias
npm install
```

### Paso 2: Configurar Turso
```
1. Ve a https://turso.tech
2. Crea una cuenta (es gratis)
3. Crea una nueva base de datos
4. Copia la URL: TURSO_DATABASE_URL
5. Copia el token: TURSO_AUTH_TOKEN
```

### Paso 3: Completar .env
```
Edita el archivo .env y pega:
- TURSO_DATABASE_URL=libsql://...
- TURSO_AUTH_TOKEN=...
- JWT_SECRET=tu_clave_secreta_aqui (puede ser cualquier cosa larga)
- PORT=3000
```

### Paso 4: Iniciar el Servidor
```bash
npm run dev
```

Abre en el navegador: `http://localhost:3000`

## 📱 Cómo Usar la App

### Registro
1. Click en "Registro"
2. Completa usuario, correo y contraseña
3. Click en "Registrarse"

### Login
1. Completa correo y contraseña
2. Click en "Iniciar Sesión"

### Crear Pedido
1. Click en "➕ Agregar Pedido"
2. Completa los datos
3. Click en "Crear"

### Editar Pedido
1. Click en "✏️ Editar" en la fila del pedido
2. Modifica los datos
3. Click en "Actualizar"

### Eliminar Pedido
1. Click en "🗑️ Eliminar"
2. Confirma la eliminación
3. El pedido se elimina

## 🔌 Modo Offline

La app funciona sin conexión:
- Verás un toast rojo: "🔴 Modo Offline"
- Los cambios se guardan localmente
- Al reconectar, se sincronizan automáticamente
- Aparece toast verde: "🟢 Conectado"

## 💾 Datos Guardados

Estos datos se guardan en tu navegador:
- Tu usuario y token (login automático)
- Cambios pendientes cuando desconectado
- Archivos de la app (para offline)

## 🛠️ Comandos Útiles

```bash
# Iniciar en modo desarrollo
npm run dev

# Iniciar en modo producción
npm start

# Limpiar caché Service Worker (DevTools)
# Application → Cache Storage → Eliminar cache

# Limpiar localStorage (Consola)
localStorage.clear()

# Ver logs en tiempo real
# DevTools → Console
```

## 🆘 Problemas Comunes

### "No puedo conectar a la base de datos"
```
✓ Verifica TURSO_DATABASE_URL y TURSO_AUTH_TOKEN en .env
✓ Comprueba que Turso esté online
✓ Intenta reiniciar el servidor
```

### "Error al registrarme"
```
✓ El correo ya existe (usa otro email)
✓ La contraseña es muy corta
✓ Faltan espacios en blanco en los datos
```

### "PWA no aparece en instalación"
```
✓ Usa HTTPS (o localhost funciona)
✓ Espera a que cargue completamente
✓ Recarga la página (F5)
✓ Abre DevTools → Application → Manifest
```

### "La app va lenta"
```
✓ Limpia caché: DevTools → Application → Clear All
✓ Recarga la página (Ctrl + Shift + R)
✓ Verifica tu conexión de internet
```

## 🎨 Personalización

### Cambiar Colores
Edita `public/css/styles.css`:
```css
:root {
  --bg-primary: #1a1a1a;      /* Fondo principal */
  --color-success: #10b981;   /* Verde */
  --color-danger: #ef4444;    /* Rojo */
  --color-warning: #f59e0b;   /* Amarillo */
}
```

### Cambiar Nombre de la App
1. Edita `public/manifest.json` (name, short_name)
2. Edita `public/index.html` (title)
3. Edita `public/css/styles.css` (si cambias colores)

### Agregar Más Campos a Pedidos
1. Modifica `server/database.js` (tabla pedidos)
2. Actualiza `server/routes.js` (validaciones)
3. Edita `public/js/ui.js` (formularios y tabla)

## 📦 Estructura de Carpetas

```
examenpracticodomingo/
├── server/             # Backend Node.js
│   ├── server.js       # Servidor principal
│   ├── database.js     # Turso + queries
│   ├── auth.js         # JWT + bcrypt
│   └── routes.js       # API endpoints
├── public/             # Frontend (archivos estáticos)
│   ├── index.html      # Página principal
│   ├── manifest.json   # PWA config
│   ├── sw.js           # Service Worker
│   ├── css/styles.css  # Estilos
│   ├── js/             # JavaScript
│   │   ├── app.js
│   │   ├── ui.js
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── offline-manager.js
│   │   ├── utils.js
│   │   └── config.js
│   └── img/            # Iconos
├── package.json        # Dependencias
├── .env                # Variables de entorno
└── .gitignore
```

## 🚀 Desplegar en Render (Producción)

### 1. Preparar GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git push -u origin main
```

### 2. En Render.com
1. Conecta tu GitHub
2. Crea "New Web Service"
3. Selecciona este repositorio
4. Nombre: `pwa-orders-app`
5. Build: `npm install`
6. Start: `npm start`
7. Añade variables de entorno
8. Click "Deploy"

### 3. URL Final
Tu app estará en: `https://pwa-orders-app.onrender.com`

## 📱 Instalar como Aplicación

### Windows/Mac/Linux
1. Abre la app en Chrome
2. Click en icono de instalación (arriba a la derecha)
3. Confirma

### iOS (iPhone/iPad)
1. Abre Safari
2. Click en "Compartir"
3. "Añadir a pantalla de inicio"

### Android
1. Abre Chrome
2. Click en menú (⋮)
3. "Instalar aplicación"

## ✅ Checklist de Verificación

- [ ] `npm install` sin errores
- [ ] `.env` completado
- [ ] Puedo acceder a `http://localhost:3000`
- [ ] Puedo registrarme
- [ ] Puedo iniciar sesión
- [ ] Puedo crear/editar/eliminar pedidos
- [ ] DevTools muestra Service Worker registrado
- [ ] Modo offline funciona
- [ ] PWA es instalable

## 📚 Documentación Completa

- `INSTALACION.md` - Instalación paso a paso
- `README.md` - Documentación completa
- `public/js/` - Código fuente comentado

## 💡 Tips

- Usa Chrome para mejor experiencia PWA
- Limpia caché regularmente durante desarrollo
- Los cambios en `server/` requieren reiniciar
- Los cambios en `public/` se reflejan automáticamente
- Mantén JWT_SECRET seguro en producción

## 🆘 Necesitas Ayuda?

1. Abre DevTools (F12)
2. Ve a Console para ver errores
3. Revisa Network para solicitudes API
4. Limpia localStorage: `localStorage.clear()`
5. Recarga la página (Ctrl + Shift + R)

¡Disfruta tu PWA! 🚀
