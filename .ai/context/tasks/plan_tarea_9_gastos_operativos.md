# Plan de Acción: Reflejo de Gastos Operativos en Contabilidad

## 1. Análisis del Problema
El usuario reporta que al facturar un servicio con insumos asociados ($1) y gastos extra de servicio ($5), estos no se reflejan correctamente en la contabilidad (Dashboard / Egresos Operativos y Globales).

Causa raíz:
1. **Clasificación Incorrecta:** En `src/db/manager.js` (`processInvoice`), el "gasto extra de servicio" se está guardando bajo la categoría `GASTO_OPERATIVO` (que se considera un gasto fijo global). Debe guardarse como `GASTO_EXTRA_SERVICIO` para que el panel de KPIs operativos lo detecte.
2. **Exclusión de Insumos en Totales:** En `src/logic/reportService.js` (`getDashboardStats`), el cálculo de `egresos_usd_totales` incluye `COMPRA_INVENTARIO` pero excluye `COSTO_INSUMO`. Esto provoca que el costo de los insumos consumidos no reste a la ganancia global de la factura, generando discrepancias donde los Egresos Operativos podrían ser mayores que los Totales.

## 2. Archivos a Modificar

### A. `src/db/manager.js`
- Buscar `processInvoice`.
- Cambiar la categoría del asiento contable de los gastos asociados a servicios:
  - De: `categoria: 'GASTO_OPERATIVO'`
  - A: `categoria: 'GASTO_EXTRA_SERVICIO'`

### B. `src/logic/reportService.js`
- Buscar `getDashboardStats` (Modo SQLite).
- Modificar el cálculo de `egresos_usd_totales` (`kpiQuery` y `flowQuery`):
  - Añadir `COSTO_INSUMO`.
  - Reemplazar `COMPRA_INVENTARIO` por `COSTO_INSUMO` para que la rentabilidad global se base en el costo de ventas (accrual) y no en el flujo de caja de compras, evitando la doble contabilidad del gasto.
  - Asegurar que `GASTO_EXTRA_SERVICIO` esté incluido.

### C. Pruebas (`tests/unit/db.manager.test.js` y `tests/contabilidad/dashboard.test.js`)
- Ajustar las pruebas para reflejar la categoría `GASTO_EXTRA_SERVICIO` y el cambio a `COSTO_INSUMO` en lugar de `COMPRA_INVENTARIO` para el Dashboard.

## 3. Resultado Esperado
Al facturar un servicio de Ginecología, la ganancia neta y los márgenes del Dashboard descontarán automáticamente el $1 del insumo y los $5 del gasto extra, mostrándolos en los Egresos Operativos de manera transparente y precisa.
