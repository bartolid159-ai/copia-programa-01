# Plan de Tarea: Refactorización UI y Reubicación del Submódulo de Gastos

Este plan aborda las dos solicitudes del usuario respecto al submódulo de gastos: corregir la estética de los campos de entrada (cajas blancas) y reubicar el módulo en una ventana emergente (modal) accesible mediante un botón en la cabecera.

## 1. Análisis de Impacto

*   **Archivos a modificar:**
    *   `src/components/Dashboard/ExpensesModule.jsx`: Para corregir los estilos CSS de los inputs y adaptarlo visualmente para que funcione bien dentro de un modal.
    *   `src/components/Dashboard/Dashboard.jsx`: Para remover el componente insertado directamente en la vista principal, añadir el botón "Gastos" en la cabecera y manejar el estado del modal.
*   **Nuevos archivos:** Ninguno.
*   **Lógica de negocio:** Sin cambios. La lógica de guardado y plantillas ya fue validada.

## 2. Cambios Específicos

### A. Corrección Estética (ExpensesModule.jsx)

*   **Problema:** Los inputs (`<input>` y `<select>`) dentro de la tabla están tomando los estilos por defecto del navegador (fondo blanco, texto negro), rompiendo la estética "dark glassmorphism".
*   **Solución:** Se añadirá una regla CSS específica dentro del bloque `<style jsx>` del componente para la clase `.form-control` (o los inputs directamente) que fuerce el estilo premium:
    ```css
    .form-control {
      background: rgba(255, 255, 255, 0.05);
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      padding: 8px 12px;
    }
    .form-control:focus {
      outline: none;
      border-color: var(--primary-color, #06B6D4);
      background: rgba(255, 255, 255, 0.1);
    }
    /* Para que los options del select se vean legibles en modo oscuro */
    select.form-control option {
      background: #1E293B;
      color: white;
    }
    ```

### B. Reubicación a Modal (Dashboard.jsx)

*   **Problema:** El módulo de gastos ocupa espacio permanentemente en el Dashboard de Contabilidad.
*   **Solución:**
    1.  Añadir un estado local en `Dashboard.jsx`: `const [showExpensesModal, setShowExpensesModal] = useState(false);`
    2.  En la sección `dashboard-header`, junto al título, añadir un botón:
        ```jsx
        <button className="btn-secondary" onClick={() => setShowExpensesModal(true)}>
          💸 Gestionar Gastos
        </button>
        ```
    3.  Eliminar la invocación directa `<ExpensesModule />` del flujo del layout.
    4.  Añadir el renderizado condicional del modal al final del componente:
        ```jsx
        {showExpensesModal && (
          <div className="modal-overlay" style={{ zIndex: 9999 }}>
            <div className="modal-content glass-card" style={{ width: '800px', maxWidth: '90%', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', position: 'absolute', top: '15px', right: '15px', zIndex: 10 }}>
                <button className="btn-icon-danger" onClick={() => setShowExpensesModal(false)}>×</button>
              </div>
              <ExpensesModule onShowBanner={filters.onShowBanner || (() => {})} />
            </div>
          </div>
        )}
        ```

## 3. Verificación (Tests)

*   **Manual:** Verificar visualmente que al hacer clic en "Gestionar Gastos" se abra el modal correctamente. Confirmar que los campos de texto y selectores dentro de las tablas tengan fondo oscuro/transparente y texto blanco, eliminando el problema de los "cuadros blancos".
*   **Unitario:** Ejecutar `npm test` para asegurar que el cambio de renderizado en `Dashboard.jsx` no rompa ningún test de integración existente (todos los tests actuales deben mantenerse en verde).

> [!IMPORTANT]
> **Aprobación Requerida:** Por favor, revisa este plan. Si estás de acuerdo con la estrategia de añadir el botón en el Dashboard y corregir el CSS directamente en el componente, indícame que puedo proceder con la implementación.
