# Plan de Implementación: Mejoras UI y Comprobante de Facturación

## Descripción del Objetivo
Implementar 4 mejoras de calidad de vida (QoL) y funcionalidad en los módulos de Liquidación, Contabilidad y Facturación, manteniendo estrictamente la estética Glassmorphism Dark Mode del sistema.

---

## Cambios Propuestos

### Cambio 1: Botón de Borrar en línea en Historial de Liquidación
**Archivo:** `src/components/Liquidation/LiquidacionPanel.jsx` (líneas ~500-523)

**Problema actual:** Los botones 📄 (Ver Recibo) y 🗑️ (Borrar) están en `flex-direction: column`, uno debajo del otro, generando una columna muy alta.

**Solución:** Cambiar la celda de `<td>` de la columna "Acciones" para que use `display: flex; flex-direction: row; gap: 8px; align-items: center;`. Los botones son del tipo `btn-view` ya existente, que se adaptarán sin problemas.

**Riesgo:** Nulo. Solo es un cambio de layout CSS en una celda.

---

### Cambio 2: Comprobante de Recibo a Tamaño Carta (Full-Page)
**Archivo:** `src/components/Liquidation/LiquidacionPanel.jsx` (estilos `@media print`, líneas ~925-940)

**Problema actual (confirmado por foto):**
1. El recibo se imprime centrado pero con mucho espacio blanco alrededor, porque el contenedor del modal (`maxWidth: 450px`) limita su ancho al imprimirlo.
2. El navegador imprime el texto "localhost:5174" en el pie de página automáticamente (esto es una configuración del navegador, pero podemos ocultarlo con CSS).

**Solución:**
- Agregar CSS `@page` con `margin: 0` y `size: letter` para eliminar los márgenes del navegador y los headers/footers automáticos.
- Asegurarse de que el `.recibo-container-printable` tome el `100%` del ancho y alto de la página.
- Añadir un diseño más rico al recibo (logo, líneas, datos clínicos) para que llene visualmente el espacio de la hoja carta.

**Riesgo Previsto:** Los estilos `@media print` pueden tener conflictos con otros elementos del DOM. Usaremos `body > *:not(.recibo-container-printable) { display: none }` para garantizar visibilidad solo del recibo.

---

### Cambio 3: Botón Eliminar con Contraseña en Historial de Gastos
**Archivo:** `src/components/Dashboard/ExpensesModule.jsx` (sección `activeTab === 'history'`, líneas ~257-290)

**Problema actual:** La tabla de historial de gastos muestra fecha, concepto, categoría y monto, pero no tiene columna de acciones con botón de eliminar.

**Pasos:**
1. Añadir una quinta columna "Acciones" al `<table>` del historial de gastos con el header correspondiente.
2. Agregar el botón 🗑️ de eliminar en cada fila del historial.
3. Importar `SecurityModal` (ya existe en el proyecto como componente reutilizable).
4. Importar `login` de `../../auth`.
5. Añadir los estados necesarios: `securityModal: { isOpen, asientoId, error }`.
6. Crear función `handleDeleteGasto(id)` → abre el modal.
7. Crear función `handleConfirmDeleteGasto(password)` → valida contraseña, llama `deleteAsientoManual(id)`.
8. **Crear la función `deleteAsientoManual(id)` en `src/db/manager.js`** si no existe. Esta función eliminará el registro de `contabilidad_asientos` por su ID.

**Riesgo Previsto:** La función `deleteAsientoManual` podría afectar otros módulos si los IDs no están bien aislados. Para mitigarlo, la función solo eliminará entradas con `tipo = 'EGRESO'` para prevenir borrado accidental de ingresos de facturas. La consulta será: `DELETE FROM contabilidad_asientos WHERE id = ? AND tipo = 'EGRESO'`.

---

### Cambio 4: Botón Ver Detalle + Imprimir Comprobante en Historial de Facturas
**Archivos principales:** `src/components/Billing/InvoiceHistory.jsx` y `src/db/manager.js`

**Problema actual:** La tabla de facturas solo tiene el botón de borrar. No hay forma de ver el detalle de servicios ni imprimir un comprobante.

**Pasos:**

#### 4a. Añadir botón "Ver Detalle" 📄 en la tabla
- En la columna "Acciones" de `InvoiceHistory.jsx`, añadir un botón 📄 al lado izquierdo del 🗑️.

#### 4b. Crear el Modal de Detalle de Factura
- Crear un nuevo estado: `facturaModal: { isOpen, factura, detalles }`.
- Al hacer click en 📄, llamar a una función `handleVerDetalle(factura)` que:
  1. Obtiene los detalles de la factura: `manager.getFacturaDetalles(f.id)` (ya existe en `manager.js` en la línea 667).
  2. Abre un modal con toda la información.

#### 4c. Modal con Comprobante Imprimible
- El modal mostrará:
  - Encabezado: Logo/Nombre del Sistema, "COMPROBANTE DE PAGO" y número de factura.
  - Datos del Paciente y del Médico.
  - Tabla de Servicios con precio unitario, cantidad, IVA y subtotal.
  - Total USD y Total VES con tasa de cambio.
  - Método de pago.
  - Pie de Firma.
- Un botón `Imprimir` llamará a `window.print()`.
- Se reutilizarán los mismos estilos `@media print` mejorados del Cambio 2 para que el comprobante salga en tamaño carta completo.

**Riesgo Previsto:**
- `getFacturaDetalles` existe pero solo en modo SQLite. Para el modo navegador (localStorage), necesitamos implementar su fallback. Los datos del detalle están guardados en el objeto de factura en localStorage, en el campo `items`.
- Garantizar que el modal de detalle no colisione con el SecurityModal de borrado que ya existe. Se manejará con z-index adecuados.

---

## Definición de Tests (Vitest)

### Tests a Crear/Modificar

**`tests/unit/ExpensesDeleteTest.test.js`** (nuevo):
- Test: `debe eliminar un gasto del historial correctamente`
- Test: `debe rechazar la eliminación si la contraseña es incorrecta`
- Test: `no debe poder eliminar un registro de tipo INGRESO`

**`tests/unit/InvoiceDetails.test.js`** (nuevo):
- Test: `debe obtener los detalles de una factura por ID correctamente`
- Test: `debe mostrar los servicios de la factura en el comprobante`

---

## Plan de Verificación Visual

1. **Historial Liquidación:** Verificar que 📄 y 🗑️ están en la misma fila horizontal.
2. **Impresión:** Abrir un recibo → Imprimir → Verificar que ocupa toda la hoja carta y no aparece "localhost" en el pie.
3. **Historial Gastos:** Ver el historial → Verificar columna de borrado → Clicar borrar → Verificar que pide contraseña.
4. **Historial Facturas:** Ver historial → Clicar 📄 en una factura → Verificar modal con servicios → Clicar Imprimir → Verificar comprobante en hoja carta.

---
**Estado:** En ejecución.
