# Rediseño del Submódulo de Gastos (Egresos)

Este plan detalla la implementación de las tres mejoras solicitadas para el submódulo de Gastos dentro del área de Contabilidad, buscando una experiencia de usuario similar a la del módulo de facturación.

## 1. Análisis de impacto en archivos existentes
- `src/db/schema.sql`: Se añadirá la tabla `categorias_gastos` y se creará una nueva estructura (o se modificará la actual) para `plantillas_gastos_fijos` para soportar múltiples ítems (ej. usando JSON en una columna `items` o tablas relacionadas).
- `src/db/manager.js`: 
  - Nuevas funciones: `getCategoriasGastos`, `insertCategoriaGasto`, `getHistorialEgresos`.
  - Modificación de: `insertGastoTemplate`, `getGastoTemplates` para manejar múltiples ítems.
- `src/components/Dashboard/ExpensesModule.jsx`:
  - Se dividirá internamente en dos vistas: Registro/Plantillas y el nuevo Historial de Gastos.
  - La interfaz de plantillas cambiará para permitir crear y procesar múltiples filas de gastos en lote.
  - Se añadirá UI para crear categorías personalizadas en el formulario de gasto.

## 2. Nuevos archivos a crear
- `tests/unit/expenses.test.js`: Nuevo archivo de pruebas unitarias específico para validar la lógica de las plantillas múltiples y el historial de egresos.

## 3. Lógica de negocio a implementar
- **Categorías Dinámicas:** Al crear una nueva categoría, se guardará permanentemente en la base de datos local para que aparezca en los selectores futuros.
- **Plantillas por Lotes:** Una plantilla almacenará un array de ítems. Al aplicarla, la interfaz mostrará todas las filas pre-cargadas, permitiendo editar montos o descripciones antes de hacer un solo clic en "Procesar Todos", lo cual ejecutará un ciclo de inserciones en `manager.js`.
- **Historial Completo:** Se consultará la tabla `contabilidad_asientos` filtrando por tipo `EGRESO`, ofreciendo una tabla limpia con todo lo que ha salido de la clínica.

## 4. Definición de los tests de Vitest necesarios
- Verificar que `insertCategoriaGasto` inserte y no duplique.
- Verificar que `getHistorialEgresos` retorne únicamente los registros tipo `EGRESO` ordenados por fecha.
- Verificar que una plantilla con múltiples ítems se guarde y recupere correctamente usando la nueva estructura JSON o relacional.
