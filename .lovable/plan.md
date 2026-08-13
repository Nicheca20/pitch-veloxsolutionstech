# Pitch 3D scroll-driven — Velox Solutions

Presentación web scroll-driven (React + Vite + Tailwind + @react-three/fiber) con una escena WebGL continua gobernada por un único `scrollProgress`. Paleta Velox eléctrica con degradados Galaxy → Velox → Force, tipografía Poppins.

## 1. Guion — 10 secciones (texto condensado, máx ~25 palabras visibles)

**01 HOOK**
Agentes que construyen agentes.
_Partner AI-first de Agentforce en LATAM._

**02 PROBLEMA**
El contexto se pierde entre fases.
_Discovery eterno, pilotos que no llegan a producción._

**03 CONSECUENCIA**
Deals que mueren antes del go-live.
_Trimestres perdidos, consumo de Agentforce que nunca arranca._

**04 SOLUCIÓN**
Veleiro: nuestra operación entera es agéntica.
_Agentes supervisados de la preventa al soporte. Agentforce en producción._

**05 CÓMO FUNCIONA** — 4 pasos (Descubrir · Definir · Diseñar · Entregar)
Un activo de datos único. Flujos pre-construidos. Gobernanza y human-in-the-loop.
Métrica: **60%** menos esfuerzo de análisis funcional.

**06 DIFERENCIAL** — 3 puntos
Alcance y precio fijos · Time-to-production en semanas · Partner que genera pipeline.

**07 PRUEBA** — tres historias, cada una con su animación 3D
- **Cencor** (financiero regulado, México): go-live en **12 semanas**, integración Oracle Fusion, fuente única de verdad. → escena F1 en pits.
- **El Cronista** (medios, Argentina→México): Croni en producción, órdenes de trabajo automáticas por sector; caso propuesto para Dreamforce. → escena avión despegando.
- **Adium** (farma regional): **85%** de consultas resueltas sin humano, **100%** de derivación correcta en casos sensibles, **60%** menos tiempo de respuesta (piloto, en revisión final). → escena guepardo.

**08 EL HILO COMÚN**
No vendemos herramientas: cambiamos cómo opera el negocio.

**09 OFERTA PARTNER CONNECT**
Diagnóstico Agéntico gratuito + roadmap de 4 semanas. Alternativa: POC de Agentforce sin costo.

**10 CTA**
Agenda el diagnóstico.
Nicolás Echeverri — necheverri@veloxsolutions.tech · Germán Perrone — gperrone@veloxsolutions.tech

Nada de cifras inventadas: todas provienen del pitch. Las cifras de Adium aparecen etiquetadas como piloto.

## 2. Escena 3D y recorrido de cámara

Una sola escena continua; la cámara viaja por una curva Catmull-Rom y el mundo se transforma por tramos.

```text
01-02  Túnel de partículas (velocidad, entrada)      cámara: avanza dentro del tubo
03     El túnel se fragmenta, partículas dispersas   cámara: frena, ligera caída
04-05  Ensamblaje: piezas forman la malla Veleiro    cámara: órbita lenta alrededor
06     Constelación de nodos conectados              cámara: retrocede, vista amplia
07a    Pista + F1 entrando a pits, mecánicos          cámara: lateral, sigue al coche
07b    Fin de pista → avión acelera y despega        cámara: pan hacia arriba
07c    Estela de nubes → guepardo galopando          cámara: travelling lateral
08     Momento sorpresa: explosión de partículas     cámara: pull-back amplio
09-10  Las partículas se reagrupan en el wordmark    cámara: se detiene de frente
```

Los tres vehículos/animal son formas estilizadas low-poly + partículas (no modelos externos), coherentes con el look wireframe eléctrico y el presupuesto de 60fps.

## 3. Reglas técnicas

- Fondo oscuro Galaxy con fog del mismo color; máx 2 luces + ambiental; MeshBasicMaterial y shaders propios.
- Máx 60.000 partículas / 150.000 triángulos; `setPixelRatio(min(dpr, 2))`; sin sombras ni post-procesado pesado.
- Detección de FPS en los primeros 2s: si <40, mitad de partículas y efectos secundarios off.
- <768px: fallback 2D con gradientes y animaciones CSS/GSAP, sin WebGL.
- `prefers-reduced-motion`: scroll nativo con fades, sin movimiento de cámara.
- Canvas `pointer-events: none`, fijo detrás de la capa DOM que scrollea.

## 4. UI y detalles

Preloader con progreso, barra de progreso superior, nav-dots laterales clicables, navegación por teclado (↓/Espacio, ↑, Esc), contadores animados en las cifras, velo radial detrás del texto para contraste AA, vista `@media print` limpia en blanco/negro, meta + Open Graph con el nombre del cliente.

## 5. Estructura

- `src/content.ts` — todo el copy del pitch, editable sin tocar UI.
- `src/components/pitch/` — `Scene`, `Section`, `Metric`, `ProgressBar`, `NavDots`, `Preloader`, y un módulo por acto 3D (`PitStop`, `Takeoff`, `Cheetah`).
- `src/routes/index.tsx` — la presentación como página principal.
- Tokens de color y degradados Velox en `src/styles.css`.

## Preguntas antes de construir

1. ¿Construyo solo la versión web (Lovable) o también el `pitch.html` autocontenido offline? Un solo HTML con Three.js/GSAP/Lenis inline no se puede generar completo aquí sin pegar manualmente ~700 KB de librerías; puedo dejar la web y luego indicar el procedimiento exacto de vendorizado.
2. ¿Tienes el SVG del logo/guepardo de Velox, o genero un wordmark tipográfico?
