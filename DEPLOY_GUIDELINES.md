# Directiva de Despliegue Automático

Siempre que se realicen cambios significativos en el código (correcciones de errores, nuevas funcionalidades o ajustes de diseño), se deben seguir estos pasos de forma automática:

1. **Commit de Git:** Realizar un commit con un mensaje descriptivo de los cambios.
2. **Build de Producción:** Ejecutar `npm run build` dentro de la carpeta `nido-app`.
3. **Despliegue en Firebase:** Ejecutar `npx firebase-tools deploy --only hosting --project nido-organic-app-jd`.

Esta directiva asegura que el entorno de producción esté siempre sincronizado con el desarrollo.
