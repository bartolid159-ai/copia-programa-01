# Plan de Tarea: Corrección de Errores en simulacro_contabilidad.test.ts

## Análisis del Problema
El archivo `tests/simulacro_contabilidad.test.ts` presenta errores de compilación/tipado en las líneas 100 y 117. Se está llamando a la función `billingEngine.calculateCommission` con dos argumentos (total_usd, porcentaje), pero la función solo acepta un argumento (un array de items).

## Impacto en Archivos Existentes
- `tests/simulacro_contabilidad.test.ts`: Se deben corregir las llamadas a `calculateCommission`.

## Nuevos Archivos a Crear
Ninguno.

## Lógica de Negocio a Implementar
Se ajustará la llamada a `calculateCommission` para que pase un array de objetos que contengan `precio_usd`, `cantidad` y `porcentaje_comision`, cumpliendo con la firma esperada por el motor de facturación.

## Definición de Tests
Se ejecutará `npm test tests/simulacro_contabilidad.test.ts` para verificar que los errores desaparezcan y el test pase correctamente.

## Pasos de Implementación
1. Modificar línea 100 de `tests/simulacro_contabilidad.test.ts`.
2. Modificar línea 117 de `tests/simulacro_contabilidad.test.ts`.
3. Ejecutar los tests para validar la solución.
