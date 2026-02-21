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
