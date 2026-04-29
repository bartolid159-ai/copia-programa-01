# Tarea: Empaquetado de Aplicación a Ejecutable Local (Electron)

**Agente Asignado:** Open Code
**Objetivo:** Convertir el proyecto web Vite/React actual en una Aplicación de Escritorio instalable (.exe) utilizando Electron y `electron-builder`, siguiendo estrictamente la Arquitectura "Local-First" descrita en `agents.md`.

## Contexto de la Tarea
El desarrollo lógico de la aplicación (Módulos, Base de datos SQLite) está terminado y validado.
La misión ahora es implementar la Fase C (Estrategia de Empaquetado "Zero-Tech"). El cliente final no debe poseer conocimientos técnicos para ejecutar el programa; todo debe venir empaquetado en un instalador autónomo (`Setup.exe`).

## Pasos de Implementación (Instrucciones para Open Code):

### 1. Preparación de Entorno y Dependencias
- Instalar como dependencias de desarrollo (`devDependencies`): `electron`, `electron-builder`, `wait-on`, `concurrently`.
- Asegurar que la librería nativa `better-sqlite3` esté contemplada para que `electron-builder` la recompile (`rebuild`) hacia binarios de Windows (x64) automáticamente durante el empaquetado.

### 2. Creación de la Infraestructura de Escritorio
- **[NEW] `electron/main.cjs`**: Archivo principal del proceso de Electron.
  - Generar la ventana de la aplicación.
  - **DATO CRÍTICO (Soberanía de Datos):** Configurar y exponer la ruta de destino de la base de datos (`data.sqlite`) apuntando a la carpeta de datos de la máquina local (`app.getPath('userData')`).
- **[NEW] `electron/preload.cjs`**: Inyectar las variables de entorno o rutas seguras (IPC) hacia el frontend de React.

### 3. Modificaciones Base del Proyecto Web
- **[MODIFY] `vite.config.js`**: Agregar la propiedad `base: './'` para que las rutas relativas funcionen adecuadamente cuando el proyecto se lea desde archivos de la computadora (`file://`).
- **[MODIFY] `src/db/manager.js`**: Lógica condicional segura. Si estamos en modo de empaquetado de producción, el archivo SQLite a leer/escribir debe ser el que reside en la ruta inyectada por Electron (`userData`), no en la carpeta del repositorio.
- **[MODIFY] `package.json`**:
  - Ajustar el entrypoint `"main"` hacia `"electron/main.cjs"`.
  - Crear los scripts `"electron:dev"` (desarrollo sincrónico) y `"build:electron"` (para crear el `.exe`).
  - Incluir el objeto `"build"` de Electron Builder: Activar protección `asar: true`, delegar `target: "nsis"` con opciones de crear accesos directos al escritorio (`createDesktopShortcut: true`) e inicio automático del programa (`runAfterFinish: true`).

### 4. Generación de Cursos y Manuales (Directriz 6 de `agents.md`)
Crear de forma física dentro del repositorio:
- **`docs/Manual_de_Usuario.md`**: Instrucciones visuales sobre la operatividad de los módulos (Facturación, Inventario, Médicos).
- **`docs/Guia_de_Instalacion.md`**: Pasos triviales ('Siguiente' -> 'Siguiente') orientados al usuario final para la ejecución del Setup.

## Criterios de Aceptación
1. El comando `npm run build:electron` genera satisfactoriamente el instalador de Windows (`setup.exe`).
2. Al instalar la aplicación, los datos (SQLite) persisten entre reinicios sin importar dónde esté instalado el binario.
3. El frontend compila y muestra correctamente los iconos y estilos.

---
**Nota para Open Code:** Detente tras leer este plan. Confirma al usuario tu entendimiento de la logística técnica para migrar de Web a Electron y luego comienza a insertar los archivos uno por uno.
