# Plan de Implementación: Ajustes y Gráficos en Contabilidad

## Descripción del Objetivo
Implementar los requerimientos solicitados para la actualización del sistema:
1. Eliminar el módulo de "Cierre de Caja".
2. Reordenar el menú lateral para que "Facturación" se ubique justo debajo de "Pacientes".
3. Agregar un gasto extra opcional (descripción y costo) en el registro de "Servicios". Al facturar el servicio, este costo adicional debe reflejarse en contabilidad como una reducción de la ganancia (como un gasto/costo operativo).
4. Añadir dos nuevos gráficos de barras individuales en el módulo de Contabilidad para visualizar los Ingresos por Servicio y los Ingresos por Médico. Estos deben tener un diseño atractivo y fácil de entender.

> **Revisión del Usuario Requerida**: Por favor revisa las preguntas abiertas a continuación para confirmar detalles sobre los gráficos y el gasto adicional de los servicios. Todo el diseño seguirá estrictamente el patrón "Local-First", "Glassmorphism" y la estética oscura y elegante ya implementada.

## Open Questions
- **Gráficos**: Utilizaré el mismo sistema de gráficos nativos responsivos basados en HTML/CSS (al igual que `RevenueChart`) para no agregar dependencias pesadas, y garantizar un look "Premium". ¿Estás de acuerdo con esto?
- **Gasto Adicional en Servicios**: Añadiré 1 solo espacio para un Gasto Extra opcional (Descripción + Precio) por servicio. ¿Es suficiente tener un solo gasto adicional por servicio (además de los insumos ilimitados)?

---

## 1) Análisis de Impacto en Archivos Existentes

### 1. Menú Principal y Layout
#### [MODIFY] `src/App.jsx`
- Eliminar importación de `CashClosing` y borrar la ruta/vista asociada.
- Reorganizar el elemento de lista (`<li>`) de "Facturación" para que esté colocado inmediatamente después del de "Pacientes".

#### [DELETE] `src/components/Settings/CashClosing.jsx`
- Eliminar el archivo por completo ya que el módulo no se necesita.

### 2. Lógica y Base de Datos (Gastos en Servicios)
#### [MODIFY] `src/db/manager.js`
- **Facturación / Asientos:** En la función `processInvoice`, agregar lógica para que si el servicio facturado tiene un gasto adicional (`gasto_precio_usd > 0`), se genere automáticamente un registro de tipo `EGRESO` en `contabilidad_asientos` de forma transparente.
- **Consultas CRUD:** Modificar `insertServicio` y `updateServicio` para que procesen `gasto_descripcion` y `gasto_precio_usd`.

#### [MODIFY] `src/db/schema.sql`
- Actualizar la sentencia de creación de la tabla `servicios` para incluir `gasto_descripcion TEXT` y `gasto_precio_usd REAL DEFAULT 0.0`.

#### [MODIFY] `src/components/Services/ServiceForm.jsx`
- Añadir sección en la interfaz (justo después de insumos) para: "Gasto Adicional (Opcional)".
- Agregar inputs para "Descripción" y "Monto (USD)".

#### [MODIFY] `src/logic/serviceLogic.js`
- Ajustar las llamadas a la BD de `registerService` y `updateService` para incluir los nuevos campos.

### 3. Dashboard Contable (Gráficos)
#### [MODIFY] `src/logic/reportService.js`
- Añadir función `getIngresosPorServicio()` que devuelva agrupados los ingresos generados por cada servicio.
- Añadir función `getIngresosPorMedico()` que devuelva agrupados los ingresos facturados por cada médico.

#### [MODIFY] `src/components/Dashboard/Dashboard.jsx`
- Integrar `IncomeByServiceChart` e `IncomeByDoctorChart` en la vista, posiblemente en una nueva fila asegurando una jerarquía visual armónica.

---

## 2) Nuevos Archivos a Crear

#### [NEW] `src/components/Dashboard/IncomeByServiceChart.jsx`
- Crear widget con estética "glassmorphism" que renderice un gráfico de barras horizontales animado mostrando los ingresos desglosados por servicio.

#### [NEW] `src/components/Dashboard/IncomeByDoctorChart.jsx`
- Crear widget similar al anterior que grafique con barras los ingresos atribuibles a cada médico.

---

## 3) Lógica de Negocio a Implementar
- **Contabilidad de Servicios**: Cuando se emite una factura, el sistema hoy guarda el costo de Insumos como 'EGRESO' y el subtotal de Servicios como 'INGRESO'. Se agregará un nuevo registro contable 'EGRESO' por concepto de "Gasto Operativo de Servicio" tomando el valor de `gasto_precio_usd` definido en el servicio de la factura. Esto descontará limpiamente de la Ganancia Neta y será auditable.
- **Datos Reales de Gráficos**: Las funciones de `reportService` recorrerán las facturas del mes actual para obtener las sumatorias reales facturadas por médico y por tipo de servicio.

---

## 4) Definición de Tests (Vitest)
### Pruebas Automatizadas
1. **Tests Unitarios en Gestor de DB (`tests/unit/manager.test.js`)**: 
   - Añadir una prueba que registre un servicio con Insumo de 1$ y Gasto Adicional de 5$. 
   - Facturar el servicio en 20$. 
   - Verificar que el `Total Ingresos` es 20$ y los `Total Egresos` son 6$, dando una `Ganancia Neta` de 14$.
2. Asegurar ejecución de `npm test` en local.
