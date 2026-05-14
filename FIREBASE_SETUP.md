# Configuración de Firebase para Nido App

Este documento detalla la configuración de Firebase necesaria para que la aplicación funcione correctamente, ya sea para un desarrollador humano o una IA.

## Proyecto Firebase
- **Project ID:** `nido-organic-app-jd`
- **Región de Firestore:** `us-east1`
- **URL de Hosting:** `https://nido-organic-app-jd.web.app`

## Credenciales de la Aplicación (Web SDK)
Estas credenciales se encuentran en `nido-app/src/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBJeoxJN1aExUjXJvUFx3qDmdWM1UTW0rg",
  authDomain: "nido-organic-app-jd.firebaseapp.com",
  projectId: "nido-organic-app-jd",
  storageBucket: "nido-organic-app-jd.firebasestorage.app",
  messagingSenderId: "655332034234",
  appId: "1:655332034234:web:cfe3c13a6c9e4afd9d2483"
};
```

## Servicios Habilitados
1.  **Authentication:**
    *   Google Sign-In habilitado.
    *   Email/Password (opcional).
2.  **Firestore Database:**
    *   Utiliza el archivo `firestore.rules` para las reglas de seguridad.
    *   Utiliza `firestore.indexes.json` para los índices.
3.  **Storage:**
    *   Utilizado para subir imágenes de recibos.
4.  **Hosting:**
    *   Configurado para servir desde `nido-app/dist`.
    *   Soporta Single Page Application (SPA) con rewrites a `/index.html`.

## Proceso de Despliegue (Deployment)
Para desplegar cambios a producción, se deben seguir estos pasos:

1.  **Instalar dependencias:**
    ```bash
    cd nido-app
    npm install
    ```
2.  **Generar el Build:**
    ```bash
    npm run build
    ```
3.  **Desplegar a Firebase:**
    Desde la raíz del proyecto (donde está `firebase.json`):
    ```bash
    npx firebase-tools deploy --only hosting --project nido-organic-app-jd
    ```

## Reglas de Seguridad (Firestore)
Las reglas están diseñadas para que solo los miembros de un mismo "household" puedan ver y editar los gastos y servicios compartidos. El archivo principal es `firestore.rules`.

## Notas para IA
- La lógica de negocio principal para Firestore reside en `nido-app/src/services/`.
- El campo `VITE_GEMINI_API_KEY` en `.env` es necesario para el procesamiento de recibos con IA.
