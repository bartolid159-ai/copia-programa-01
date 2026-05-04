# Plan de Tarea: Corrección de IVA y Filtro de Fechas en Facturación (Tarea 14)

## 1. Análisis de Impacto
- **Archivos Existentes a Modificar:** 
    - `src/components/Billing/InvoiceHistory.jsx`:
        - Agregar inputs tipo fecha (`Desde` y `Hasta`) en la interfaz.
        - Integrar la función de filtrado por rango de fechas en la carga de datos (`loadFacturas`).
        - Refactorizar la función `handleViewInvoice` para no calcular el 16% de IVA de manera automática sobre el subtotal, usando el IVA real guardado o aplicando 0% por defecto.
        - Ocultar la fila de IVA en el modal si el valor de IVA es 0.
    - `src/logic/billingEngine.js`:
        - Actualizar `calculateTotals` para que el cálculo de IVA por defecto sea nulo o 0%. Solo se aplicará la tasa de IVA si el ítem lo requiere explícitamente (se asumirá que no lleva IVA por defecto a menos que no sea exento o posea el indicador correcto).
    - `src/db/manager.js`:
        - Verificar y extender `getHistorialFacturas` o similares para soportar la recepción de un rango de fechas (`startDate`, `endDate`) directamente de la UI.

- **Nuevos Archivos:**
    - No se crearán nuevos componentes de UI, pero se actualizarán/crearán suites de prueba en la carpeta `tests/` para validar estas modificaciones.

## 2. Lógica de Negocio
- **Cálculo de IVA (Condicional por defecto a 0%):** En el ERP médico, la mayoría de los servicios (consultas, procedimientos) están exentos. El sistema actualmente aplicaba un +16% fijo en el modal de Detalles. Esto se cambiará para que iterativamente cada servicio aporte al IVA solo si tiene el valor correspondiente asignado (`es_exento` false o el `iva_porcentaje` en la base de datos).
- **Filtro Dinámico de Fechas:** Los nuevos selectores permitirán elegir "Fecha Inicio" y "Fecha Fin". Al modificar cualquiera de ellos o presionar buscar, el listado consultará la base de datos para recuperar las facturas de ese rango. Si están vacíos, se mostrarán los datos recientes (comportamiento actual).
- **Integridad del Total:** Eliminar el cargo automático garantizará que el "Total a Pagar" corresponda exactamente a la sumatoria real de los servicios y no incluya un impuesto no facturado.

## 3. Definición de Tests (Vitest)
1. **Prueba de IVA Condicional (`billingEngine.test.js` / Integración):**
   - Validar que un arreglo de servicios por defecto retorne un `iva_usd` igual a 0 y que el `subtotal` sea igual al `total`.
   - Validar que si un ítem explícitamente requiere IVA, solo ese ítem tribute en el total.
2. **Prueba de Filtro de Fechas (`InvoiceHistory.test.jsx` / Mock DB):**
   - Simular la introducción de fechas en los nuevos campos "Desde" y "Hasta".
   - Confirmar que la función de carga (`loadFacturas`) es llamada con los parámetros correctos de fechas, aislando así el historial y mostrando las facturas específicas en el componente.

---
*A la espera de la instrucción: "Plan aprobado, procede con la implementación".*
