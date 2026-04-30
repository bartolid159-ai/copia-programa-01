# Plan de Tarea: Filtros de Fecha y Borrado de Pacientes con Seguridad

Este plan detalla la implementación de segmentación por mes/año en el Dashboard y la adición de un sistema de borrado de pacientes protegido por contraseña.

## 1. Análisis de Impacto y Cambios

### Backend y Lógica de Negocio
- **`src/db/manager.js`**:
    - Implementar `deletePaciente(id)`. Esta función debe ser atómica (transacción) y eliminar:
        1. Asientos contables asociados a las facturas del paciente.
        2. Detalles de las facturas del paciente.
        3. Las facturas del paciente.
        4. El registro del paciente.
    - Esto garantiza que no queden "datos huérfanos" y se mantenga la integridad contable.
- **`src/logic/reportService.js`**:
    - Ajustar `getDashboardStats` para aceptar parámetros opcionales de `month` y `year`.
    - Si se proporcionan, se calcularán automáticamente las fechas de inicio y fin del mes/año correspondiente para filtrar los datos.

### Interfaz de Usuario (UI)
- **`src/components/Dashboard/DashboardFilters.jsx`**:
    - Añadir selectores de **Mes** (Enero - Diciembre) y **Año** (Año actual y anteriores).
    - Lógica de sincronización: al cambiar mes/año, se actualizan los campos "Desde" y "Hasta" automáticamente.
- **`src/components/Patients/PatientList.jsx`**:
    - Añadir columna de "Acciones" con botón de borrado (índice de basura 🗑️).
    - Integrar `SecurityModal` para solicitar la clave de administrador antes de proceder.
    - Llamar a la nueva lógica de borrado y refrescar la lista.

## 2. Nuevos Archivos / Modificaciones

| Archivo | Acción | Descripción |
|---|---|---|
| `src/db/manager.js` | Modificar | Añadir `deletePaciente`. |
| `src/logic/reportService.js` | Modificar | Ampliar `getDashboardStats`. |
| `src/components/Dashboard/DashboardFilters.jsx` | Modificar | Añadir selectores de Mes/Año. |
| `src/components/Patients/PatientList.jsx` | Modificar | Añadir borrado con seguridad. |
| `tests/unit/PatientDeletion.test.js` | Crear | Test unitario para el borrado de pacientes y su impacto contable. |

## 3. Lógica de Implementación

### Borrado Atómico de Paciente
```javascript
export const deletePaciente = (id) => {
  return executeTransaction(() => {
    const db = getDb();
    // 1. Obtener IDs de facturas del paciente
    const facturas = db.prepare('SELECT id FROM facturas WHERE id_paciente = ?').all(id);
    const facturaIds = facturas.map(f => f.id);
    
    if (facturaIds.length > 0) {
      const placeholders = facturaIds.map(() => '?').join(',');
      // 2. Borrar detalles y asientos
      db.prepare(`DELETE FROM factura_detalles WHERE id_factura IN (${placeholders})`).run(...facturaIds);
      db.prepare(`DELETE FROM contabilidad_asientos WHERE referencia_id IN (${placeholders}) AND categoria IN ('SERVICIO', 'COMISION', 'COSTO_INSUMO')`).run(...facturaIds);
      // 3. Borrar facturas
      db.prepare(`DELETE FROM facturas WHERE id_paciente = ?`).run(id);
    }
    
    // 4. Borrar paciente
    return db.prepare('DELETE FROM pacientes WHERE id = ?').run(id);
  });
};
```

### Filtros de Mes/Año
En `DashboardFilters.jsx`, se implementará una función `handleMonthYearChange` que use `new Date(year, month, 1)` y `new Date(year, month + 1, 0)` para establecer el rango de fechas.

## 4. Definición de Tests (Vitest)
1. **Test de Borrado**: Verificar que al borrar un paciente, desaparezcan sus facturas y asientos contables.
2. **Test de Filtros**: Validar que al seleccionar "Enero 2024", el rango de fechas sea exactamente del 2024-01-01 al 2024-01-31.

---
**DETENCIÓN OBLIGATORIA**: Por favor, revisa este plan. Una vez aprobado, procederé con la ejecución atómica.
