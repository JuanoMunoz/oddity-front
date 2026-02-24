# Oddity Frontend - Architecture Overview

Este documento detalla la estructura técnica y el flujo de datos de la plataforma frontend de **Oddity**. La arquitectura ha sido diseñada para ser modular, escalable y visualmente impactante, utilizando las mejores prácticas de React moderno.

## 🛠 Stack Tecnológico

- **Framework**: React 18+ con Vite.
- **Routing**: React Router DOM v6.
- **Styling**: TailwindCSS (configura la base estética y tokens de diseño).
- **Animations**: Framer Motion (maneja micro-interacciones y transiciones premium).
- **Icons**: Lucide React.
- **State Management**: React Context API + Custom Hooks.

---

## 🏗 Arquitectura de Carpetas

```text
src/
├── components/     # UI Atómica y componentes compartidos (Button, Sidebar, etc.)
├── context/        # Proveedores de estado global (AppContext)
├── hooks/          # Lógica reutilizable (useApp, useAuth)
├── layouts/        # Envoltorios de estructura (RootLayout)
├── pages/          # Vistas de página completa (Home, Auth, Panel)
├── routes/         # Configuración de React Router
├── styles/         # Utilidades de Tailwind y tokens de diseño
└── styles/utils.ts # Funciones de ayuda como 'cn' para clases condicionales
```

---

## 🚦 Flujo de Navegación (React Router DOM)

Utilizamos `createBrowserRouter` para una gestión de rutas moderna basada en objetos.

- **RootLayout**: Es el contenedor principal que renderiza el `Navbar` y el `Footer`. Utiliza `<Outlet />` para inyectar las páginas según la URL.
- **Rutas Protegidas**: (En desarrollo) El `Panel` está diseñado para ser accesible solo cuando `state.user` no es nulo.

```tsx
// routes/index.tsx
export const router = createBrowserRouter([
    {
        path: '/',
        element: <RootLayout />,
        children: [
            { index: true, element: <Home /> },
            { path: 'panel', element: <Panel /> },
            // ... otras rutas
        ]
    }
]);
```

---

## 🧠 Estado Global (Context API)

El `AppContext` centraliza el estado crítico de la aplicación para evitar el "prop-drilling".

- **Temas**: Gestiona el switch `light | dark` y sincroniza la clase del `document.body`.
- **Autenticación**: Almacena el objeto `user` y la información de la organización.
- **Acciones**: Provee funciones como `login`, `logout` y `toggleTheme`.

---

## ✨ Sistema de Diseño y UI

### Tokens de Diseño (`@theme` en CSS)
Definimos colores personalizados en Tailwind para mantener la consistencia:
- `--color-primary`: Naranja Oddity (#F18F01).
- `--color-secondary`: Azul Oscuro Profundo (#0F172A).
- `--color-dark`: Negro Obsidian (#12100E).

### Visibilidad Adaptativa (Theming)
Implementamos una arquitectura de **Herencia de Temas** en `index.css`. En lugar de forzar colores manualmente, los elementos base (`h1`, `p`, `span`) cambian automáticamente de color según la clase del body. Esto previene el bug de "texto invisible" en modo oscuro.

---

## 🧩 Hooks Personalizados

### `useApp()`
El hook principal para interactuar con el estado global.
```tsx
const { state, toggleTheme, logout } = useApp();
```

### `useAuth()`
(Placeholder) Diseñado para futuras integraciones con APIs de backend para login persistente.

---

## 🚀 UX del Panel

El área de `/panel` utiliza un sistema de **Vistas Dinámicas**:
1. El `Sidebar` notifica al `Panel` qué vista activar (`setActiveView`).
2. El `Panel` utiliza un `switch` para renderizar el componente correspondiente.
3. **Framer Motion** envuelve el renderizado con `<AnimatePresence />` para crear transiciones de salida y entrada fluidas (scale, opacity, y).

---

## 🛠 Mantenimiento y Escalabilidad

1. **Nuevos Componentes**: Deben seguir el patrón atómico en `/components`.
2. **Nuevos Agentes**: Se añaden como casos adicionales en el `renderContent()` del `Panel.tsx`.
3. **Variables CSS**: Cualquier ajuste de color global debe hacerse en `index.css` bajo la directiva `@theme`.
