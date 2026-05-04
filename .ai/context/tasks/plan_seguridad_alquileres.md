# Plan de Tarea: Seguridad en Borrado de Alquileres

## 1. Análisis de Impacto
- **Archivos Existentes:**
    - `src/components/Rentals/RentalList.jsx`: Reemplazar `window.confirm` por `SecurityModal`.
    - `src/auth.js`: Se utilizará la función `login` para validar la clave.

## 2. Cambios Técnicos
- Importar `SecurityModal` desde `../Common/SecurityModal`.
- Importar `login` desde `../../auth`.
- Implementar estado `securityModal` para controlar la apertura, el ID del registro y errores de validación.
- Refactorizar `handleDelete` para abrir el modal en lugar de usar el prompt del navegador.
- Crear `handleConfirmDelete` para procesar la validación de clave y ejecución del borrado.

## 3. Lógica de Negocio
- Solo el administrador (u operario con clave) podrá eliminar registros de alquiler.
- Al confirmar, se debe invocar a `alquilerService.eliminarAlquiler(id)`.

## 4. Definición de Tests
- Verificar que el modal de seguridad se despliega al presionar el botón de eliminar.
- Validar que un intento con clave incorrecta muestre el error correspondiente.
- Confirmar que el registro desaparece de la lista tras una clave exitosa.

---
*A la espera de la instrucción: "Plan aprobado, procede con la implementación".*
