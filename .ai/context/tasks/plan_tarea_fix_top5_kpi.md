# Plan Tarea: Fix Top 5 Servicios KPI Discrepancy

## 1. Análisis de impacto en archivos existentes
El problema radica en que el cálculo de la ganancia neta para el Pareto de "Top 5 Servicios" no está restando el gasto extra operativo del servicio (`gasto_precio_usd`) en el entorno de escritorio (SQLite).

Archivos afectados:
- `src/logic/reportService.js`: Modificar la consulta SQL en la función `getTopServicios` para incluir el gasto extra.
- `tests/simulacro_contabilidad.test.ts`: Actualizar el test E2E para agregar un gasto extra a los servicios probados y asegurar que la contabilidad global y la del top 5 cuadran perfectamente.

## 2. Nuevos archivos a crear
No se requieren archivos nuevos. Todo se resolverá actualizando la lógica en los servicios y validándolo en los tests existentes.

## 3. Lógica de negocio a implementar
En `reportService.js` (`getTopServicios`), se actualizará la consulta `SELECT` que usa SQLite:
- Se calculará el total de gasto extra del servicio usando: `SUM(fd.cantidad * IFNULL(s.gasto_precio_usd, 0)) as total_gasto_extra_usd`.
- En la cláusula `ORDER BY`, se descontará `total_gasto_extra_usd`.
- En el mapeo final del array `results.map(...)`, la `ganancia_neta_usd` restará explícitamente `total_gasto_extra_usd`.

## 4. Definición de los tests de Vitest necesarios
En `simulacro_contabilidad.test.ts`:
- Se modificará el servicio de prueba "Consulta General QA" para que incluya un `gasto_precio_usd: 10`.
- Se verificarán los nuevos totales esperados en el dashboard: Egresos y Ganancia Neta global.
- Se verificará que el KPI `getTopServicios()` ahora devuelve la ganancia neta exacta para "Consulta General QA", deduciendo tanto comisión, insumos como el gasto extra del servicio.
