# Documentación Técnica — Brújula

## 1) Resumen técnico

**Brújula** es una app móvil **local-first** construida con **Expo + React Native + TypeScript**, orientada a autorregulación personal.  
No usa backend ni servicios remotos para persistencia funcional: la información se guarda en **SQLite local** en el dispositivo.

Características técnicas clave:
- Navegación por archivos con `expo-router` (tabs + stack).
- Persistencia local con `expo-sqlite` y esquema versionado por `PRAGMA user_version`.
- Notificaciones locales con `expo-notifications` para el modo de hiperfoco.
- Integraciones de dispositivo para compartir/importar/exportar datos y mensajería (WhatsApp).

## 2) Arquitectura de la solución

### 2.1 Capas

- **Capa UI / navegación**: `app/`
- **Capa de componentes reutilizables**: `src/components/`
- **Capa de dominio (reglas)**: `src/semaphore/`
- **Capa de datos local (SQLite + repositorios)**: `src/db/`
- **Constantes funcionales / copy**: `src/constants/`

### 2.2 Flujo general

1. `app/_layout.tsx` inicializa DB (`initDb`) y permisos de notificaciones.
2. El usuario navega entre tabs definidas en `app/(tabs)/_layout.tsx`.
3. Cada pantalla consulta/actualiza datos mediante funciones de `src/db/*`.
4. Reglas de negocio puntuales (ej. semáforo) se aplican desde módulos dedicados (`computeSemaphore`).
5. Toda persistencia principal queda en tablas locales del archivo `brujula.db`.

## 3) Tecnologías y aplicación en el repo

| Tecnología | Rol técnico | Aplicación en este proyecto | Evidencia en código |
|---|---|---|---|
| **TypeScript** | Tipado estático y contratos de datos | Define tipos de filas, inserts y estados de UI; reduce errores en capa DB/UI | `tsconfig.json`, `src/db/initDb.native.ts` |
| **React 19** | Modelo declarativo de UI y estado | Pantallas funcionales con hooks (`useState`, `useEffect`, `useCallback`, `useMemo`) | `app/(tabs)/estado.tsx`, `app/(tabs)/arranque.tsx` |
| **React Native 0.81** | Runtime móvil multiplataforma | Componentes base (`View`, `Text`, `Pressable`, `ScrollView`, `Modal`, etc.) | Todas las pantallas de `app/` |
| **Expo SDK 54** | Toolchain y runtime nativo gestionado | Unifica build, bundling y módulos nativos (SQLite, notificaciones, sharing, etc.) | `package.json`, `app.json` |
| **expo-router** | Enrutamiento file-based | Stack principal + tabs + rutas dinámicas (`protocolos/[id]`) | `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `app/protocolos/[id].tsx` |
| **expo-sqlite** | Persistencia local SQL | DB local `brujula.db`, creación de tablas, consultas y actualizaciones | `src/db/initDb.native.ts`, `src/db/*.ts` |
| **expo-notifications** | Notificaciones locales | Recordatorios de cortes y hora de dormir en “Sesión de foco” | `app/_layout.tsx`, `app/sesion-foco.tsx` |
| **expo-linking** | Deep linking/URL schemes | Apertura de `whatsapp://send` para pedir apoyo | `app/pedir-apoyo.tsx`, `app/sesion-foco.tsx` |
| **expo-clipboard** | Portapapeles del dispositivo | Fallback para copiar mensajes cuando WhatsApp no abre | `app/pedir-apoyo.tsx` |
| **expo-document-picker** | Selección de archivos | Importación manual de JSON de ajustes | `app/(tabs)/ajustes.tsx` |
| **expo-file-system** | Lectura/escritura de archivos | Exporta backup JSON local y lee archivo de importación | `app/(tabs)/ajustes.tsx` |
| **expo-sharing** | Compartir archivos nativo | Comparte export de datos JSON desde el teléfono | `app/(tabs)/ajustes.tsx` |
| **react-native-safe-area-context** | Respeta zonas seguras (notch/status bar) | Envoltorio principal de pantallas con `SafeAreaView` | Múltiples pantallas en `app/` |
| **@expo/vector-icons (Ionicons)** | Iconografía UI | Iconos de tabs y acciones (incl. eliminar en historial) | `app/(tabs)/_layout.tsx`, `app/(tabs)/historial.tsx` |
| **expo-status-bar** | Manejo de status bar | Configuración del estilo de barra en layout raíz | `app/_layout.tsx` |
| **Babel preset Expo** | Transpilación JS/TS para Expo | Configuración base de compilación | `babel.config.js` |
| **EAS Build/Submit** | Distribución y CI/CD de app móvil | Perfil `preview` (APK interno) y `production` (AAB) | `eas.json` |

## 4) Mapa funcional por módulo

### 4.1 Navegación y shell

- `app/index.tsx`: redirige a `/(tabs)/estado`.
- `app/_layout.tsx`:
  - inicializa base de datos local,
  - solicita permisos de notificación,
  - escucha respuestas de notificaciones para abrir CTA de bedtime.
- `app/(tabs)/_layout.tsx`: define tabs (`Estado`, `Arranque`, `Protocolos`, `Historial`, `Ajustes`).

### 4.2 Pantallas de negocio

- `app/(tabs)/estado.tsx`:
  - captura variables de estado (energía, carga sensorial/social, ambigüedad, ira),
  - calcula semáforo,
  - guarda check-ins,
  - expone entradas rápidas al resto de flujos.

- `app/(tabs)/arranque.tsx`:
  - asistente anti-ambigüedad en 2 minutos,
  - crea tareas pendientes,
  - timer de inicio,
  - puede activar sesión de foco cuando la tarea es larga.

- `app/sesion-foco.tsx`:
  - crea/reanuda sesión de hiperfoco,
  - programa notificaciones periódicas y escaladas,
  - registra cierre y minutos excedidos sobre hora límite,
  - CTA de apoyo vía WhatsApp en overtime.

- `app/rojo-descarga.tsx`:
  - checklist configurable,
  - temporizador de descarga,
  - decisión de cierre con desvío a pedir apoyo si no mejora.

- `app/pedir-apoyo.tsx`:
  - compone mensajes estructurados con estado actual,
  - usa plantillas editables,
  - envío por WhatsApp con fallback a copiado.

- `app/social.tsx`:
  - registro pre/post social,
  - deriva a descarga si costo social/sensorial alto.

- `app/(tabs)/protocolos.tsx` + `app/protocolos/[id].tsx`:
  - listado de protocolos,
  - ejecución checklist paso a paso.

- `app/(tabs)/historial.tsx`:
  - vistas históricas de check-ins/tareas/social,
  - métricas agregadas,
  - borrado de registros.

- `app/(tabs)/ajustes.tsx` + `app/ajustes/plantillas.tsx`:
  - personalización de checklist y reglas de hiperfoco,
  - edición de plantillas de mensajes,
  - export/import de datos.

### 4.3 Componentes reutilizables

- `src/components/ValueStepper.tsx`: control incremental 0–10 para escalas.
- `src/components/InfoTip.tsx`: ayuda contextual en modal para reducir ambigüedad de uso.

### 4.4 Dominio

- `src/semaphore/computeSemaphore.ts`:
  - implementa reglas de clasificación `VERDE/AMARILLO/ROJO`.

### 4.5 Datos locales

- `src/db/initDb.native.ts`:
  - crea tablas: `checkins`, `tasks`, `protocols`, `partner_templates`, `social_logs`, `settings`, `focus_sessions`.
  - maneja versionado/migraciones con `user_version`.
- `src/db/*.ts`:
  - repositorios por agregado (checkins, tasks, protocols, templates, settings, social, focus).
- `src/db/initDb.web.ts`:
  - stub web (sin SQLite en navegador) para evitar crash fuera de móvil.

## 5) Modelo de datos (SQLite)

Tablas principales:
- `checkins`: estado periódico del usuario y resultado de semáforo.
- `tasks`: tareas de arranque con estado, estimación y tiempo real.
- `protocols`: protocolos accionables serializados en JSON.
- `partner_templates`: textos para pedir apoyo y acciones sugeridas.
- `social_logs`: registros antes/después de eventos sociales.
- `settings`: configuración personalizada (checklist y foco).
- `focus_sessions`: sesiones de hiperfoco con cierre y overtime.

## 6) Plataforma, build y distribución

- **App config**: `app.json` (bundle/package ids, plugins, splash, iconos, projectId de EAS).
- **Build profiles**: `eas.json`
  - `preview`: APK interno para pruebas con dev client.
  - `production`: AAB para distribución.
- **Estrategia de desarrollo**:
  - recomendado `expo-dev-client` para módulos nativos,
  - alternativa Expo Go con túnel Cloudflare en entornos de red restringida.

## 7) Dependencias declaradas con uso no explícito (revisión sugerida)

En `package.json` hay paquetes cuyo uso no es evidente en los archivos revisados y conviene confirmar si siguen siendo necesarios:
- `expo-constants`
- `expo-font`
- `expo-splash-screen`
- `react-dom` / `react-native-web` (útiles para objetivo web, aunque el flujo principal es móvil)

> Recomendación: validar con auditoría de imports antes de limpiar dependencias para no romper build ni futuros features.

## 8) Consideraciones técnicas relevantes

- **Privacidad**: enfoque sin backend por diseño; datos sensibles permanecen locales.
- **Resiliencia offline**: operaciones centrales no dependen de red.
- **Riesgo de plataforma**: comportamiento web está intencionalmente limitado por dependencia de SQLite y APIs nativas.
- **Mantenibilidad**: separación por capas (`app/`, `src/db/`, `src/semaphore/`, `src/components/`) facilita evolución incremental.

---

Documento generado con base en el estado actual del repositorio en `main`.
