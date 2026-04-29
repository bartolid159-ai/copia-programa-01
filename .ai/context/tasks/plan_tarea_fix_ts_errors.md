# Plan de Tarea: Corrección de Errores de Tipado TypeScript en Pruebas de Contabilidad

## 1. Análisis de Impacto
Se han detectado errores de tipado en el archivo de prueba `tests/simulacro_contabilidad.test.ts` debido a la exportación de archivos JavaScript sin definiciones de tipos y al modo estricto de TypeScript.

### Archivos Afectados:
- `src/logic/billingEngine.js`: Contiene una anotación JSDoc incorrecta (`@param {Array} serviciosInsumos`) que induce a error al compilador TS.
- `tests/simulacro_contabilidad.test.ts`: El archivo principal con múltiples errores de acceso a propiedades en tipos genéricos (`Object`) y parámetros con `any` implícito.

## 2. Cambios Propuestos

### A. Modificación de JSDoc en `src/logic/billingEngine.js`
- Corregir el tipo del parámetro `serviciosInsumos` en `getRequiredInsumos` de `Array` a `Object` (Map).

### B. Refactorización de `tests/simulacro_contabilidad.test.ts`
- **Interfaces**: Definir interfaces locales para `InvoiceTotals`, `InsumoAlerta` y `TopServicio` para dar contexto a TS.
- **Tipado Explícito**: 
    - Castear los resultados de `billingEngine.calculateTotals` a la interfaz `InvoiceTotals`.
    - Especificar tipos en las funciones de callback de `find` para evitar el error de `any` implícito.
    - Usar encadenamiento opcional (`?.`) al acceder a propiedades de resultados de búsqueda (`find`) para satisfacer la comprobación de nulidad de TS.
    - Asegurar que el objeto pasado a `getRequiredInsumos` coincida con lo esperado.

## 3. Lógica de Negocio
No hay cambios en la lógica de negocio. Es una tarea de mantenimiento de infraestructura de pruebas y robustez de código.

## 4. Definición de Tests
Se deben ejecutar las pruebas unitarias existentes para asegurar que la corrección de tipos no rompió la ejecución:
- Comando: `npm test tests/simulacro_contabilidad.test.ts`

---
**DETENCIÓN OBLIGATORIA:** Esperando aprobación del plan para proceder con la implementación.
