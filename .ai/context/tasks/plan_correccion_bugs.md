# Plan de Corrección de Bugs y Ajustes Finales

Este plan detalla las correcciones necesarias para asegurar la operatividad al 100% de los módulos de Facturación, Liquidaciones, Compras y Contabilidad. Todo se mantendrá bajo la estética visual actual del programa (*Premium Glassmorphism*).

## Proposed Changes

### Módulo de Facturación y Base de Datos
El botón "Ver Detalles" falla porque las funciones que consultan la factura específica no soportaban el entorno de desarrollo web (`isBrowser`).

#### [MODIFY] `src/db/manager.js`
- Modificar `getFacturaById` para soportar búsqueda en `localStorage` cuando esté en modo navegador (`isBrowser`).
- Modificar `getFacturaDetalles` para extraer y formatear correctamente los servicios asociados desde `localStorage` usando la factura guardada.
- Añadir función `deleteCompra(id)` para el módulo de compras, asegurando la eliminación correcta.

### Módulo de Liquidaciones de Médicos
Al imprimir, la hoja sale en blanco debido a una regla estricta en el CSS (`@media print`) que oculta el elemento raíz de React.

#### [MODIFY] `src/components/Liquidation/LiquidacionPanel.jsx`
- Ajustar las reglas `@media print` para no ocultar `#root` de React de forma abrupta, sino ocultar `nav` y utilidades visuales secundarias.
- Asegurar que la estructura del comprobante (`recibo-container-printable`) pase a ocupar el 100% del ancho del papel, forzando texto negro y fondo blanco.
- Verificar si quedan restos de `<style jsx>` y removerlos o aplicarlos al css de `index.css`.

### Módulo de Compras (Inventario)
Falta el botón de eliminación en la tabla del historial.

#### [MODIFY] `src/components/Purchases/PurchasesList.jsx`
- Importar `SecurityModal` y manejar el estado para requerir contraseña al eliminar.
- Añadir la columna "Acción" a la tabla de historial de compras.
- Implementar el botón "🗑️" con la clase premium roja.
- Conectar el botón a la nueva función `deleteCompra` de la base de datos.

### Módulo de Contabilidad (Dashboard/Gastos)
Asegurar el botón de eliminación de gastos en los historiales.

#### [MODIFY] `src/components/Dashboard/ExpensesModule.jsx` y `src/components/Dashboard/Dashboard.jsx`
- Asegurar que el botón de eliminar gasto sea visible y accionable desde cualquier tabla de historial donde se listen egresos.
- Comprobar dependencias de estilos y llamadas al API en el entorno `isBrowser`.
