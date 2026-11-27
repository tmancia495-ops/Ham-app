# Ham! · Splash Screen

Esta primera parte reproduce el [Splash de Figma](https://www.figma.com/design/QBS9EZwZDVXO9Mf2HndKRi/Ham-?node-id=2-806). La imagen sube suavemente mientras el logo queda quieto. Aproximadamente dos segundos después de que empieza la animación, abre Iniciar sesión. También puedes tocar el Splash para pasar de inmediato.

## Cómo abrirlo

1. Descomprime el ZIP completo. En VS Code abre la carpeta `ham-splash` con **Archivo → Abrir carpeta**.
2. Abre `index.html` con Live Server si ya lo tienes instalado. También puedes abrir el archivo directamente en un navegador. No requiere npm ni un framework.
3. Comprueba que el fondo se vea, que suba y que llegue a `iniciar-sesion.html`. Para comparar con Figma, pon la vista del navegador en **402 × 874 px** antes de recargar.

## Qué no olvidar

- Conserva `assets/splash-fondo.png` en su carpeta. Ya está incluida la imagen original del fondo. Si la cambias, exporta en Figma la capa de fondo **sin el logo**. Deja el mismo nombre o actualiza la ruta `src` en `index.html`.
- Conserva `assets/Fredoka-Bold.woff2` para que el logo se vea igual sin depender de internet. Su licencia está en `assets/Fredoka-OFL.txt`.
- Mantén `index.html`, `splash.css`, `splash.js` e `iniciar-sesion.html` en la misma carpeta. Si publicas el prototipo, sube también `assets/` completo y respeta las mayúsculas de los nombres.
- `iniciar-sesion.html` es provisional. Reemplázalo con el diseño real cuando lo codifiques. Si lo renombras, cambia el `href` del Splash en `index.html`. JavaScript toma el destino de ese mismo enlace.
- Para ajustar la duración, edita `DURACION_SPLASH_MS` en `splash.js`. Para ajustar cuánto sube el fondo, edita `@keyframes subir-fondo` en `splash.css`.
