# Plan de Implementación: Seguridad Local y Respaldo de Base de Datos

**Objetivos principales:**
1. Crear un sistema automático de respaldo (backup) que consulte al usuario al intentar cerrar la aplicación.
2. Implementar una pantalla de "Login" obligatoria al iniciar el programa.
3. Crear un panel de configuración interna (⚙️) para cambiar y gestionar credenciales y claves de operaciones destructivas.

---

## 1. Sistema de Respaldo al Cerrar (Backup en Electron)
**Archivos a Modificar:** `electron/main.cjs`
**Lógica:**
* Interceptaremos el evento de cierre (`mainWindow.on('close', ...)`) de Electron.
* Usaremos `dialog.showMessageBox` (API nativa de Windows/MacOS) para preguntar: "¿Desea crear una copia de seguridad antes de salir?".
* Si el usuario selecciona "Sí", abriremos `dialog.showSaveDialog` para que elija dónde guardar el archivo (ej. `Escritorio` o carpeta de Google Drive sincronizada).
* Con `fs.copyFileSync`, copiaremos en tiempo real la base de datos `data.sqlite` original a la ubicación elegida con el nombre `Respaldo_Clinica_[Fecha].sqlite`.
* Luego, se permitirá el cierre de la aplicación con `app.exit()`.

---

## 2. Pantalla de Inicio de Sesión Obligatorio (Login)
**Nuevos Archivos:** `src/components/Auth/LoginScreen.jsx`
**Archivos a Modificar:** `src/App.jsx`, `src/auth.js`
**Lógica:**
* En `App.jsx` crearemos un estado global `isAuthenticated` (por defecto `false`).
* Si `isAuthenticated` es falso, la UI renderizará exclusivamente el nuevo componente `<LoginScreen />`, ocultando el Dashboard y el Sidebar.
* El `LoginScreen` tendrá un diseño premium *Glassmorphism*. Al introducir credenciales, consumirá `login(username, password)` de `src/auth.js`.
* Si el login es exitoso, `isAuthenticated` pasa a `true` y el programa desbloquea las funciones.

---

## 3. Panel de Configuración de Claves (Settings / Tuerca ⚙️)
**Nuevos Archivos:** `src/components/Settings/SettingsModal.jsx`
**Archivos a Modificar:** `src/components/Dashboard/Dashboard.jsx`, `src/db/manager.js`
**Lógica:**
* Añadiremos un icono de engranaje (⚙️) en la barra superior (`TopBar` dentro del Dashboard).
* Al hacer clic, se abrirá un `<SettingsModal />`.
* **Seguridad de doble capa:** Para establecer una nueva clave (tanto la de inicio de sesión como la de operaciones administrativas como borrar facturas), el modal exigirá que se ingrese primero la contraseña actual.
* Modificaremos `manager.js` para crear una función `updateUserPassword(username, newPassword)` que ejecute un `UPDATE users SET password = ?` de manera segura, utilizando bcrypt para volver a encriptar la nueva clave.

---

## Criterios de Finalización y Pruebas
- El instalador en formato ejecutable debe permitir cerrar la ventana sin errores colgantes.
- El archivo `.sqlite` exportado debe poder ser abierto por un visor SQLite (ej. DBeaver) demostrando que los datos están completos.
- Los tests en Vitest para las funciones de autenticación deben adaptarse para el cambio de credenciales dinámico.
