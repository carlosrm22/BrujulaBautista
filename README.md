# Brújula

App **local-first** de apoyo personal: menos ambigüedad, menos sobrecarga, más control.

- **Semáforo de estado** (energía, carga sensorial/social, ambigüedad)
- **Arranque 2 min** — primer paso ejecutable + timer anti-ambigüedad
- **ROJO: Descarga** — checklist y timer de descarga
- **Pedir apoyo (WhatsApp)** — mensaje claro para pareja
- **Protocolos** — tarjetas de estrés/ansiedad
- **Pre/Post social** — registro de costo
- **Ajustes** — checklist ROJO, plantillas, export

No diagnostica. No sustituye terapia. Datos solo en dispositivo.

## Requisitos

- Node.js 18+
- Expo CLI (opcional: `npx expo start`)

## Instalación

```bash
npm install
npx expo start
```

## Desarrollo con Development Build (Android) — Recomendado

> **¿Por qué?** Desde SDK 53, `expo-notifications` y otras librerías nativas ya **no funcionan en Expo Go** en Android. Para probar notificaciones locales, permisos o cualquier módulo nativo custom, necesitas un **Development Build** instalado en el dispositivo.

### Primer setup (una sola vez)

1. **Instalar EAS CLI:**
   ```bash
   npm install -g eas-cli
   eas login  # inicia sesión con tu cuenta Expo
   ```

2. **Configurar el proyecto (ya está hecho):**
   El archivo `eas.json` ya tiene el perfil `preview` configurado para generar un APK de desarrollo.

3. **Generar el APK de Development Build:**
   ```bash
   eas build --platform android --profile preview
   ```
   Esto subirá el código a los servidores de Expo, compilará el APK y te dará una URL de descarga. El primer build puede tardar 10–20 minutos.

4. **Instalar el APK en el dispositivo.**

### Flujo de trabajo diario

Una vez instalado el APK, para desarrollar con hot-reload:

```bash
npx expo start --dev-client
```

Abre el APK en el celular → escanea el QR o ingresa la IP manualmente → la app cargará el código desde tu máquina en tiempo real.

> **Nota:** El APK solo necesita reinstalarse si cambias dependencias nativas (`package.json`). Para cambios solo de código TypeScript/TSX, basta con `npx expo start --dev-client`.



## Desarrollo con Expo Go (túnel Cloudflare)

> **Alternativa:** Solo necesaria si el Development Build no está disponible o quieres probar flujos que no requieran módulos nativos.

Cuando fallan las conexiones locales (LAN con aislamiento AP, o USB con ADB colgado), la forma más confiable de conectar tu teléfono a tu servidor de desarrollo local es enviando el tráfico de Metro a un **túnel de Cloudflare**.

### Requisitos

Tener [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/) instalado en tu máquina de desarrollo.

### Pasos exactos

1. **Terminal 1 — Iniciar el Túnel**
   Expón el puerto 8081 local:
   ```bash
   cloudflared tunnel --url http://localhost:8081
   ```
   *(Nota: si tienes el ejecutable descargado en la carpeta, usa `./cloudflared`)*

2. **Obtener la URL pública del túnel**
   En la salida de la Terminal 1, busca una URL que termina en `trycloudflare.com` (ej: `https://palabra-aleatoria.trycloudflare.com`).

3. **Terminal 2 — Arrancar Expo con la URL inyectada**
   En otra pestaña, en la raíz de tu proyecto, arranca Metro pasándole la URL del túnel como variable de entorno `EXPO_PACKAGER_PROXY_URL` y limpiando la caché (`-c`):
   ```bash
   EXPO_PACKAGER_PROXY_URL="https://palabra-aleatoria.trycloudflare.com" npx expo start -c
   ```

4. **Conectar Expo Go**
   - El código QR que se genere en la terminal (o si presionas `c` para ver la appweb) ya tendrá la configuración correcta del túnel.
   - Escanea el QR con la cámara de tu teléfono (o ábrelo en Expo Go) y conectará directamente pasando por la nube de Cloudflare, saltándose cualquier restricción de tu red Wi-Fi o firewall local.

## Checklist de seguridad (desarrollo con agentes)

- No ejecutar comandos destructivos sin confirmación (`rm -rf`, `format`, etc.).
- Crear ramas por feature para cambios revisables.
- Mantener cambios pequeños y commiteables.

## Estructura

- `app/` — rutas Expo Router (tabs + pantallas)
- `src/db/` — SQLite (checkins, tasks, protocols, settings, etc.)
- `src/semaphore/` — lógica semáforo
- `src/constants/` — copy y listas por defecto

## Licencia

Uso personal.
