# Plan Tarea: Fix Top 5 Servicios KPI (Browser Mode) Discrepancy

## 1. Análisis de impacto en archivos existentes
Aunque corregimos la lógica SQL para el Pareto (Top 5) de Servicios, la aplicación utiliza una arquitectura dual donde en modo desarrollo/browser se usa `localStorage` (`IS_BROWSER_MODE = true`).
En la función `getTopServicios` de `reportService.js` para modo navegador, se estaba calculando la comisión usando `doctor.porcentaje_comision` en lugar del nuevo modelo `servicio.porcentaje_comision`. Dado que los doctores ya no tienen `porcentaje_comision` (quedó obsoleto en la Tarea 12), la comisión restada era `0`, lo que inflaba artificialmente la ganancia neta en los testeos del usuario en navegador en $10.

Archivos afectados:
- `src/logic/reportService.js`: Modificar el bloque `if (IS_BROWSER_MODE)` dentro de `getTopServicios`.

## 2. Nuevos archivos a crear
No se requieren archivos nuevos.

## 3. Lógica de negocio a implementar
En `reportService.js` (`getTopServicios`, bloque `IS_BROWSER_MODE`):
- Eliminar la búsqueda heredada de comisiones del médico: `const doctor = doctors.find(...)` y `const comisionPorcentaje = ...`.
- Dentro del bucle de items, buscar el servicio correspondiente (`const srv = ...`).
- Calcular `comisionPorcentaje` a partir del servicio (`srv.porcentaje_comision / 100`).
- Calcular `costo_comision = precio * comisionPorcentaje`.
- Mantener la deducción de `costo_gasto_extra` e `insumoPorItem` que ya está funcionando bien en navegador.

## 4. Definición de los tests de Vitest necesarios
El test `simulacro_contabilidad.test.ts` ya valida exitosamente el lado SQLite. Para probar la rama `IS_BROWSER_MODE`, podríamos mockear `typeof window` en un nuevo bloque del test, o confiar en que el cálculo espejo al de SQLite restaurará la exactitud matemática. No agregaremos más tests E2E ya que la lógica es puramente matemática en un array en memoria.
