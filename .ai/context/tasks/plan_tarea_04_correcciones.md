# Plan de Implementación: Corrección de Bugs (Edición de Pacientes y Visibilidad de Logos)

Este plan aborda los dos problemas reportados para garantizar que el programa funcione correctamente tanto en entorno web como en Electron (Local-First).

## 1. Corrección de la Duplicación de Pacientes
**Problema:** Al editar un paciente desde el formulario (`PatientForm.jsx`), el sistema siempre está llamando a la función `registerPatient` (la cual crea un nuevo registro y verifica si la cédula existe) en lugar de llamar a `updatePatient`. Además, la función `updatePatient` en el backend SQL estaba incompleta (tenía un comentario "TODO").

**Cambios propuestos:**
*   **[MODIFY] `src/db/manager.js`:** Añadir la función `updatePaciente(data)` con la sentencia SQL `UPDATE` correspondiente para la tabla `pacientes`.
*   **[MODIFY] `src/logic/patientService.js`:** Actualizar la función `updatePatient` para que, en modo de producción (SQL), invoque a `db.updatePaciente(patientData)` en lugar de devolver un mensaje "placeholder".
*   **[MODIFY] `src/components/Patients/PatientForm.jsx`:** Modificar la lógica de `handleSubmit` para que detecte si el paciente ya tiene un `id` asignado. Si lo tiene, invocará `updatePatient`; si no, invocará `registerPatient`.

## 2. Visibilidad del Logo ("imagen y salud systems")
**Problema:** El logo fue ubicado en `public/images/logo.png` y referenciado usando la ruta absoluta `/images/logo.png`. En un entorno web (servidor de desarrollo) esto funciona, pero cuando la aplicación corre como un ejecutable local (Electron) sin servidor de por medio (usando el protocolo `file://`), las rutas absolutas fallan porque intentan buscar en la raíz del disco duro.

**Cambios propuestos:**
*   **[NEW] Mover archivo:** Trasladaremos la imagen a `src/assets/logo.png` (creando la carpeta `assets` si es necesario).
*   **[MODIFY] `src/App.jsx` y `src/components/Auth/LoginScreen.jsx`:** Cambiaremos la forma en que se inserta la imagen. Usaremos la importación de módulos de React/Vite (`import logo from '../../assets/logo.png';`) en lugar de rutas crudas de HTML. Esto asegurará que el empaquetador de Vite asigne dinámicamente la ruta correcta en todos los entornos, incluyendo el ejecutable.

## Verification Plan

### Automated Tests
- Ejecutar el comando de tests unitarios locales `npm test` para garantizar que la nueva función `updatePaciente` sea estable y no rompa la estructura existente.

### Manual Verification
- Levantar el entorno local de desarrollo.
- Confirmar visualmente que el logotipo carga correctamente en el inicio de sesión y en la barra lateral.
- Intentar editar un paciente existente (ej. cambiar su edad o teléfono) y guardar. Verificar que la lista muestre los cambios sobre el mismo paciente y no cree uno nuevo.

> [!IMPORTANT]  
> Quedo a la espera de tu indicación: **"Plan aprobado, procede con la implementación"** para ejecutar estos pasos, siguiendo tu regla estricta de SDD.
