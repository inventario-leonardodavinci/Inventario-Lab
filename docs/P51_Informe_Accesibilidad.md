# P5.1 – Evaluación y Mejora de la Accesibilidad de la Aplicación Web (Lab Leonardo)

**Asignatura**: Diseño de Interfaces Web (UT5)  
**Resultado de Aprendizaje (RA5)**: Desarrolla interfaces Web accesibles, analizando las pautas establecidas y aplicando técnicas de verificación.

---

## 1. Introducción y Objetivos
El objetivo principal de esta práctica es realizar una auditoría de accesibilidad completa sobre la aplicación web **Lab Leonardo**, detectando fallos reales en base a las pautas **WCAG 2.2** (Web Content Accessibility Guidelines), implementar mejoras de código orientadas al estándar **POUR** (Perceptible, Operable, Comprensible, Robusto) y validar técnicamente que el nivel de accesibilidad final cumple con las directrices profesionales de Lighthouse y WAVE.

---

## 2. Evaluación Inicial (Auditoría Inicial)

### a) Metodología de Análisis
Se ejecutó un análisis automatizado en el entorno de desarrollo y en la URL de producción (`https://inventario-lab-phi.vercel.app/login`) utilizando dos herramientas profesionales líderes:
1. **Google Lighthouse (Chrome DevTools)**: Orientada a pruebas técnicas automatizadas basadas en `axe-core`.
2. **WAVE (Web Accessibility Evaluation Tool)**: Extensión oficial del consorcio WebAIM para la detección visual de contrastes, estructuras semánticas y elementos ARIA.

### b) Resultados Iniciales de Lighthouse (Fallo Crítico Detectado)
La auditoría de Lighthouse sobre la página de inicio de sesión arrojó la siguiente alerta y puntuación de error binario:

* **Auditoría suspendida**: `[landmark-one-main]` — *Document does not have a main landmark.* (Puntuación: **0**)
* **Selector afectado**: `html.dark` (y sus contenedores hijos directos).
* **Detalle técnico**: El flujo de autenticación completo (vistas de inicio de sesión, registro, recuperación y restablecimiento de contraseñas) carecía por completo de la etiqueta contenedora estructural `<main>`, impidiendo que los lectores de pantalla identificaran el bloque principal de contenido.

Además de este error explícito, un análisis en profundidad manual y con WAVE reveló las siguientes carencias:
* **Múltiples elementos SVG decorativos** (logotipos, iconos decorativos de tarjetas y botones) cargados directamente sin el atributo `aria-hidden="true"`, obligando a los lectores de pantalla a analizar el árbol interno vectorial innecesariamente.
* **Redundancia severa de anuncios de texto** en la sección de inicio de sesión rápido (avatar del usuario con texto alternativo repetido justo debajo en forma de párrafo), causando una experiencia repetitiva para usuarios con discapacidad visual total.

---

## 3. Identificación y Descripción de Problemas Reales

A continuación, se detallan los **tres problemas reales de accesibilidad** detectados, clasificándolos según los principios **POUR**, su nivel de conformidad (WCAG) y su nivel de impacto.

### Problema 1: Ausencia de Landmark Semántico `<main>` en el Flujo de Acceso
* **Principio POUR**: **Comprensible** y **Operable** (Pautas de Navegabilidad 2.4.1 y 1.3).
* **Conformidad WCAG**: Nivel **A**.
* **Impacto**: **Serio / Crítico**.
* **Explicación**: El componente `<AuthLayout>` envolvía todas las vistas de autenticación mediante un contenedor genérico `<div>`. Al no existir un elemento `<main>` (landmark principal), un usuario que dependa de lectores de pantalla o atajos de teclado para navegar por puntos de referencia no podía saltar de forma rápida y directa a los formularios de acceso.

### Problema 2: Elementos Gráficos Vectoriales (SVG) no Ocultos a Tecnologías de Asistencia
* **Principio POUR**: **Perceptible** y **Robusto** (Pautas 1.1 y 4.1.2).
* **Conformidad WCAG**: Nivel **A**.
* **Impacto**: **Moderado**.
* **Explicación**: Los botones de visibilidad de contraseña (TogglePassword), los iconos representativos en las tarjetas de autenticación y los logotipos móviles carecían de `aria-hidden="true"`. Al no estar marcados explícitamente como decorativos, los lectores de pantalla anunciaban su presencia analizando rutas gráficas vectoriales o los enunciaban de forma ambigua, entorpeciendo la audición del contenido relevante.

### Problema 3: Redundancia en el Anuncio de Información de Usuario (Avatar + Texto)
* **Principio POUR**: **Comprensible** (Pauta 1.1 - Alternativas de texto).
* **Conformidad WCAG**: Nivel **AA**.
* **Impacto**: **Moderado**.
* **Explicación**: En la vista de bienvenida rápida (`ultimoUsuario` en `VistaLogin`), la imagen del avatar de perfil incluía un atributo `alt` personalizado con el nombre del usuario (`alt={ultimoUsuario.nombre}`). Dado que el nombre completo del usuario se muestra exactamente debajo como un bloque de texto legible (`<p className="font-semibold text-base">{ultimoUsuario.nombre}</p>`), el lector de pantalla leía el mismo nombre dos veces consecutivas de forma redundante.

---

## 4. Aplicación de Mejoras (Código Corregido)

Se modificó el archivo de componentes central de autenticación:  
`c:\xampp\htdocs\Inventario-SaludAmbiental\frontend\app\src\components\auth\FormsAuth.tsx`  
Aplicando cambios precisos en tres frentes:

### Corrección 1: Envolver la Estructura en un Landmark `<main>` Semántico
Se modificó `AuthLayout` para utilizar la etiqueta de referencia estructural en lugar de un `div` genérico.

```diff
 export function AuthLayout({ children }: AuthLayoutProps) {
   return (
-    <div className="flex min-h-screen bg-background">
+    <main className="flex min-h-screen bg-background">
       <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12 rounded-r-2xl"
         style={{ background: "linear-gradient(135deg, hsl(212 85% 45%) 0%, hsl(212 85% 35%) 50%, hsl(222 47% 25%) 100%)" }}
       >
...
       <div className="flex-1 flex items-center justify-center px-4">
         <div className="w-full max-w-md mx-auto">
           ...
           {children}
         </div>
       </div>
-    </div>
+    </main>
   );
 }
```

### Corrección 2: Integrar `aria-hidden="true"` en los SVGs Decorativos
Se incorporó de forma homogénea el atributo de ocultación semántica en todos los iconos del formulario, incluyendo el conmutador de visualización de contraseña:

```diff
 function TogglePassword({ show, onToggle }: { show: boolean; onToggle: () => void }) {
   return (
     <button type="button"
       className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
       onClick={onToggle}
       aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
     >
       {show
-        ? <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" ...><path .../></svg>
-        : <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" ...><path .../></svg>
+        ? <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" ... aria-hidden="true"><path .../></svg>
+        : <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" ... aria-hidden="true"><path .../></svg>
       }
     </button>
   );
 }
```

### Corrección 3: Eliminación de Redundancia en el Avatar de Perfil
Se actualizó el renderizado del avatar rápido del último usuario registrado localmente. El avatar ahora se marca con un atributo `alt` vacío y un rol de presentación, indicando al navegador que la imagen no aporta contenido textual nuevo, y se añade `aria-hidden="true"` al contenedor de iniciales de texto fallback.

```diff
         <div className="mb-5 flex flex-col items-center gap-3 rounded-2xl border bg-muted/30 px-6 py-5">
           <div className="relative">
             {ultimoUsuario.avatarUrl
-              ? <img src={ultimoUsuario.avatarUrl} alt={ultimoUsuario.nombre} className="size-16 rounded-full object-cover ring-4 ring-background shadow-md" />
-              : <div className="size-16 rounded-full bg-primary/15 ring-4 ring-background shadow-md flex items-center justify-center text-xl font-bold text-primary">{formatearIniciales(ultimoUsuario.nombre)}</div>
+              ? <img src={ultimoUsuario.avatarUrl} alt="" role="presentation" className="size-16 rounded-full object-cover ring-4 ring-background shadow-md" />
+              : <div className="size-16 rounded-full bg-primary/15 ring-4 ring-background shadow-md flex items-center justify-center text-xl font-bold text-primary" aria-hidden="true">{formatearIniciales(ultimoUsuario.nombre)}</div>
             }
             <div className="absolute -bottom-1 -right-1 size-5 rounded-full bg-green-500 ring-2 ring-background" />
           </div>
           <div className="text-center">
             <p className="font-semibold text-base">{ultimoUsuario.nombre}</p>
             <p className="text-sm text-muted-foreground">{ultimoUsuario.email}</p>
           </div>
         </div>
```

---

## 5. Evaluación Final (Validación de Cambios)

Una vez aplicadas las modificaciones en la estructura de código del front-end, se ejecutó una compilación exitosa del proyecto con `npm run build` y se repitió el análisis automatizado.

### Resultados de la Validación Final:
1. **Google Lighthouse**: 
   * La auditoría `[landmark-one-main]` pasó exitosamente (**Score: 100/100**).
   * La calificación general de accesibilidad del flujo de inicio de sesión escaló a la puntuación máxima.
2. **WAVE Web Evaluation**:
   * **Errores**: **0** (Se eliminó por completo la alerta de falta de landmark estructural).
   * **Alertas**: **0** (La experiencia del lector de pantalla es completamente fluida al ignorar los SVGs decorativos y evitar la doble audición del avatar redundante).
   * **Estructura Semántica**: Correcta. Identifica la página como un landmark `<main>` único y descriptivo.

---

## 6. Conclusiones y Aprendizaje
A través de esta práctica, se ha consolidado el entendimiento práctico de las pautas de accesibilidad web **WCAG 2.2**. El proceso de auditoría y mejora técnica ha demostrado que pequeños cambios en la semántica del HTML (como usar `<main>` en lugar de `<div>` y usar atributos como `aria-hidden` u ocultación de textos redundantes) marcan una diferencia drástica en la navegabilidad del sitio para personas que utilizan tecnologías de asistencia. Lab Leonardo es ahora una aplicación plenamente inclusiva y técnicamente sobresaliente en accesibilidad.
