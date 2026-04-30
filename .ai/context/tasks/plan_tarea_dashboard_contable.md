# [Plan de Ejecución] Dashboard de Flujo de Negocio en Tiempo Real

Este documento establece la ruta técnica y funcional para transformar el módulo de contabilidad en un Dashboard interactivo y en tiempo real, cumpliendo con las políticas de "Local-First" y "Cero-Nube" (SQLite).

## A. Plan de Ejecución (Paso a Paso)

### Fase 1: Capa de Datos y Base de Datos (SQLite)
1. **Auditoría y Modificación del Esquema (Migrations):**
   - Verificar y asegurar la existencia de índices compuestos en `contabilidad_asientos` y `facturas` para optimizar consultas de fecha, especialista y servicio.
   - *Query propuesta:* `CREATE INDEX IF NOT EXISTS idx_contabilidad_fecha_cat ON contabilidad_asientos(fecha, categoria);`
2. **Actualización de `reportService.js`:**
   - Reescribir las funciones `getKpiDia` y `getFlujoDiario` para aceptar un objeto de filtros: `{ startDate, endDate, idMedico, idServicio }`.
   - Implementar generadores de query dinámicos en SQL (Lógica de strings parametrizados) que apliquen los filtros usando la cláusula `WHERE` (Aditivos AND).
3. **Estado Inicial (N=1):**
   - Asegurar el uso de `COALESCE(SUM(debe_usd), 0)` en SQL para garantizar retornos de `$0.00` en lugar de `null` en sistemas sin datos, previniendo quiebres de UI (NaN).

### Fase 2: Capa Lógica y Pruebas
1. **Lógica de Márgenes (`reportService.js`):**
   - Implementar la fórmula `Margen = ((Ingresos - Egresos) / Ingresos) * 100`.
   - Asegurar salvaguarda de división por cero: `Ingresos === 0 ? 0 : Margen`.
2. **Pruebas (Vitest):**
   - Crear `tests/contabilidad/dashboard.test.js` para simular escenarios: N=1 (vacío), 1 factura, múltiples filtros cruzados, facturas anuladas y cálculo exacto de margen neto.

### Fase 3: Capa de Presentación (React / UI)
1. **Componente de Filtros (`DashboardFilters.jsx`):**
   - Transformar los dropdowns simples en selectores múltiples (Multi-Select) para médicos y servicios.
   - Implementar un selector de rango de fechas consolidado (Día, Mes, Año, Personalizado).
2. **Componentes KPI (`KpiPanel.jsx` / `FinancialSummary.jsx`):**
   - Actualizar para recibir datos filtrados y repintar en tiempo real (useEffect con dependencias de los filtros).
3. **Manejo de Casos Vacíos:**
   - Pantalla de "Empty State" con ilustraciones de "Tu negocio comienza aquí" cuando no hay datos.

---

## B. Gestión de Errores y Casos de Borde

1. **División por Cero en Margen de Ganancia:**
   - *Fallo:* Cuando `Ingresos = 0`, la fórmula arroja `Infinity` o `NaN`.
   - *Solución:* Wrapper de validación: `const margen = ingresos > 0 ? ((ingresos - egresos) / ingresos) * 100 : 0;`
2. **Distorsión del Margen por Egresos Fijos al Filtrar por Especialista:**
   - *Fallo:* Si se filtra por "Dr. López", restarle la renta del local (Egreso Fijo) distorsiona su rentabilidad y genera márgenes negativos irreales.
   - *Solución:* Cuando el filtro de Especialista está activo, los Egresos Fijos se **excluyen** del panel de KPIs y la etiqueta cambia a "Margen de Contribución" (Solo Ingresos vs Costos Directos y Comisiones).
3. **Facturas Anuladas Contabilizadas como Ingreso:**
   - *Fallo:* Las facturas en estado `ANULADA` siguen sumando al Flujo de Caja si la query SQL solo lee `contabilidad_asientos`.
   - *Solución:* Modificar el query para hacer `JOIN facturas f ON as.referencia_id = f.id WHERE f.estado != 'ANULADA'` o garantizar el asiento reverso (Contra-Asiento) al anular.
4. **Desfase de Zonas Horarias en Filtro Diario:**
   - *Fallo:* Las facturas creadas a las 11:59 PM (UTC) saltan al día siguiente en hora local (Local-First).
   - *Solución:* Estandarizar guardado y consultas SQLite utilizando las funciones `datetime(fecha, 'localtime')` o procesando todo estrictamente desde la hora local del sistema cliente.
5. **Impacto de Pagos Parciales:**
   - *Fallo:* Calcular rentabilidad sobre facturas con saldo deudor (no pagadas al 100%) infla el flujo de caja.
   - *Solución:* Usar la suma de transacciones de caja (Pagos Reales recibidos) como `Ingreso Bruto de Caja` y no el Monto Total de Facturas emitidas.

---

## C. Lógica de Negocio y Algoritmos

**Motor de Cálculo Dinámico (`useDashboard.js`):**
Cada vez que el `DashboardFilters` emite un cambio (ej. `[idMedico1, idMedico2]`), se dispara el re-cálculo:
1. El backend (SQLite) arma un query con cláusulas `IN`: `WHERE id_medico IN (?, ?)`
2. Retorna los agregados (Ingresos, Costos Directos).
3. El frontend recalcula:
   \`\`\`javascript
   function calcularKPIs(datosCrudos, isFiltradoPorMedico) {
      const ingresos = datosCrudos.ingresos;
      // Si hay filtro por médico, ignorar fijos para evitar sesgos
      const egresos = isFiltradoPorMedico ? datosCrudos.egresos_directos : datosCrudos.egresos_totales;
      const margenNeto = ingresos > 0 ? ((ingresos - egresos) / ingresos) * 100 : 0;
      return { ingresos, egresos, margenNeto };
   }
   \`\`\`

---

## D. Propuesta de UX/UI para "Flujo de Negocio"

1. **Paleta Visual y Señalética:**
   - **Ingresos:** Verde esmeralda (#10B981)
   - **Egresos:** Rojo coral (#EF4444)
   - **Margen de Ganancia:** Azul primario con ícono de tendencia creciente/decreciente comparando con el periodo anterior.
2. **Gráfico de Tendencias:**
   - Reemplazar gráficos estáticos con un "Área Spline" (Curvas suaves) donde la zona verde sobrepase a la roja, ilustrando la "Respiración del Negocio" (Breathing Business).
3. **Skeleton Loading:**
   - Transiciones suaves entre cambio de filtros con efecto `pulse` gris para evitar parpadeos molestos de layout.
4. **Micro-animaciones (Wow Effect):**
   - Contadores numéricos que "ruedan" del antiguo valor al nuevo al aplicar filtros (Efecto Odómetro) mediante librerías locales ligeras o CSS nativo.

---
**Impacto de Archivos:**
- **[MODIFICAR]** `src/logic/reportService.js` (Backend local de datos para admitir filtros variables)
- **[MODIFICAR]** `src/components/Dashboard/DashboardFilters.jsx` (Selectores múltiples)
- **[MODIFICAR]** `src/components/Dashboard/KpiPanel.jsx` (Manejo de estados dinámicos e indicadores)
- **[NUEVO]** `tests/contabilidad/dashboard.test.js` (Pruebas unitarias de filtros y N=1)

**Estado:** A la espera de aprobación del usuario.
