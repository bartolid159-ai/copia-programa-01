# Plan de Implementación: Refactorización de Comisiones por Servicio

## 1. Contexto y Objetivos
Desacoplar la lógica de comisiones del perfil del médico y vincularla directamente al servicio prestado. En facturación, la comisión total se calculará sumando la comisión individual de cada servicio y se asignará al médico seleccionado (de forma global para la factura, respetando la estructura actual de la tabla `facturas`).

## 2. Análisis de Impacto (Archivos a modificar)

### Base de Datos (`src/db/schema.sql` y `src/db/manager.js`)
- **`servicios`**: Añadir campo `porcentaje_comision REAL DEFAULT 0.0`.
- Ignorar/Obsoletar `porcentaje_comision` en `medicos` y `id_medico_defecto` en `servicios`.
- **Migración**: Se creará una función de migración en la inicialización de la BD que añada la columna `porcentaje_comision` a la tabla `servicios` si no existe.

### Módulo de Médicos
- **`src/components/Doctors/DoctorForm.jsx`**: Eliminar el campo "Porcentaje de Comisión".
- **`src/components/Doctors/DoctorList.jsx`**: Eliminar la columna de comisión en la tabla.
- **`src/logic/doctorService.js` / `src/db/manager.js`**: Remover validaciones y asignaciones de `porcentaje_comision`.

### Módulo de Servicios
- **`src/components/Services/ServiceForm.jsx`**: 
  - Eliminar selector "Médico por defecto".
  - Añadir campo de entrada "Porcentaje de Comisión (%)".
- **`src/components/Services/ServiceList.jsx`**: 
  - Ocultar/eliminar la columna de médico por defecto.
  - Mostrar la nueva columna de "Comisión (%)".
- **`src/logic/serviceLogic.js` / `src/db/manager.js`**: Actualizar las consultas SQL (`insertServicio`, `updateServicio`) para guardar `porcentaje_comision`.

### Módulo de Facturación
- **`src/components/Billing/InvoiceForm.jsx`**:
  - **Selector de Servicios**: Cambiar el `<select>` actual por un buscador (input con autocompletado), similar a la búsqueda de pacientes.
  - **Selector de Médico**: Añadir un selector explícito de Médico (global para la factura), obligatorio antes de procesar, ya que no se auto-derivará del servicio.
  - **Cálculo de Comisión**: Enviar el array de items con sus respectivos porcentajes a `billingEngine`.
- **`src/logic/billingEngine.js`**:
  - Modificar `calculateCommission(items)` para que itere sobre los servicios y sume `(precio_usd * cantidad * porcentaje_comision / 100)`.

## 3. Lógica de Negocio
1. Al crear o editar un servicio, se define qué porcentaje de comisión otorga.
2. En Facturación, el usuario selecciona el paciente y establece la tasa de cambio.
3. El usuario busca y selecciona los servicios (el buscador permite texto).
4. El usuario selecciona **el médico tratante** de la factura.
5. El sistema calcula: `Comisión Total = Σ (Servicio[i].precio * Servicio[i].cantidad * Servicio[i].porcentaje_comision)`.
6. Al guardar, en los asientos contables (`contabilidad_asientos`), se registrará el EGRESO por concepto de COMISION con el monto total derivado de los servicios.

## 4. Pruebas y Aseguramiento (Vitest)
Se modificarán o crearán los siguientes tests:
- **`src/logic/billingEngine.test.js`**:
  - **Test**: `calculateCommission` debe retornar la sumatoria de las comisiones de los items, ignorando la comisión del doctor.
  - **Test**: Servicios con 0% de comisión no deben sumar al total de comisión.
- **`src/components/Billing/InvoiceForm.test.jsx`**:
  - Validar que no se puede procesar la factura si no se ha seleccionado un médico.
  - Validar que el buscador de servicios filtra correctamente por nombre.

## 5. Pasos de Ejecución
1. Actualizar esquemas de BD y crear script de migración.
2. Refactorizar UI y lógica del módulo de Médicos.
3. Refactorizar UI y lógica del módulo de Servicios.
4. Refactorizar UI, buscador de servicios y lógica del módulo de Facturación.
5. Actualizar los tests unitarios con Vitest.
6. Realizar prueba local integral (`npm test` y visual).

---
> **[DETENCIÓN OBLIGATORIA]**
> Esperando confirmación del usuario ("Plan aprobado, procede con la implementación") para iniciar la escritura de código.
