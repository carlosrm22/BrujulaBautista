# PRD — Brújula (app personal) v0.1

## 0) Resumen

**Brújula** es una app **local-first** (sin backend) para uso personal que reduce:

1. **apagones/fatiga física** por sobrecarga (sensorial/social),
2. **congelamiento por ambigüedad** al iniciar tareas,
3. **costo post-social** (masking) sin culpa,
   y permite **pedir apoyo a mi pareja por WhatsApp** con mensajes claros y accionables.

**No diagnostica. No es terapia.** Es una herramienta de apoyo y autorregulación.

---

## 1) Usuarios

* **Yo (usuario principal)**: necesito baja carga sensorial, flujos cortos, decisiones binarias, control.
* **Mi pareja (receptora por WhatsApp)**: necesita instrucciones claras (1 línea) para ayudar sin invadir.

---

## 2) Principios de diseño

* **Baja carga sensorial**: animaciones OFF, sonidos OFF, vibración OFF.
* **3 toques máximo** para activar ayuda desde Home.
* **Cero moralina**: no rachas, no "fallaste".
* **Anti-ambigüedad**: copy explícito, opciones limitadas, defaults sensatos.
* **Privacidad**: datos locales, export opcional con cifrado.

---

## 3) Navegación

Tab bar (4): **Estado**, **Arranque**, **Protocolos**, **Ajustes**.

Acciones globales (desde Estado): **ROJO: Descarga**, **Pedir apoyo (WhatsApp)**.

---

## 4) Lógica del semáforo (default)

* **ROJO** si: Energía física ≤ 2 **o** Carga sensorial ≥ 8 **o** Carga social ≥ 8 **o** Ambigüedad ≥ 9.
* **AMARILLO** si: energía 3–4 **o** cualquier carga 6–7.
* **VERDE** en el resto.

---

## 5) Criterios de aceptación (MVP)

* Desde Home puedo activar **Arranque** o **ROJO** en ≤ 3 toques.
* "Arranque 2 min" siempre termina en un **primer paso ejecutable** + timer.
* "Pedir apoyo" genera un mensaje **no ambiguo** y se puede **enviar por WhatsApp** o copiar.
* La app funciona **offline**.
* Animaciones/sonidos OFF por defecto.

---

## 6) No-Goals (por ahora)

* Comunidad / chat social
* IA obligatoria en la nube
* Diagnóstico o puntuaciones clínicas
* Gamificación de hábitos

---

## 7) v0.2 — Guardián de hiperfoco

**Concepto**: Un modo preventivo para proteger el sueño y evitar el secuestro cognitivo del hiperfoco sin apagar la sesión abruptamente.

### Funcionalidades Core (MVP)
1. **Inicio de Sesión**: Un botón "Sesión de foco" accesible directamente desde el Tab **Estado**.
2. **Dashboard de Sesión**: Muestra tiempo transcurrido, próximo corte, y botones grandes de acción (Pausa 2 min, Seguir 25 min, Cierre 10 min, Terminar).
3. **Integración "Arranque 2 min"**: Opción automática para arrancar el guardián de hiperfoco tras iniciar una tarea de arranque (Opción B).
4. **Cortes y Escalado Notificacional**:
   * Recordatorio suave cada X min (ej. 45 min).
   * Al llegar a la **Hora límite de sueño**, muestra aviso firme + "plan de cierre".
   * Si excede +30/+60 min la hora límite, muestra un botón directo para **Pedir apoyo por WhatsApp** ("recuérdame dormir").
5. **Aftercare**: Al terminar una sesión, sugiere registrar check-in o ir a ROJO: Descarga.

### Criterios de Aceptación (v0.2)
* Puedo iniciar una "Sesión de foco" con 1 toque desde la pantalla de Estado o tras completar un "Arranque 2 min".
* Si pasan 60 min sin break, aparece una notificación local (silenciosa).
* Si es después de mi hora límite (ej. 01:00 AM), la app me exige un "Cierre 10 min" o me muestra un CTA para pedir ayuda por WhatsApp.
* Todo el historial de hiperfoco (`focus_sessions`) se guarda localmente y se incluye en la exportación manual de Ajustes.
* La funcionalidad está controlada por configuraciones en Ajustes (Hora límite, Frecuencia de corte, Escalado nocturno).
