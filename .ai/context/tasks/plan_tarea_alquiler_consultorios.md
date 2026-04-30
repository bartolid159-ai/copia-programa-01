# Plan de Implementación: Módulo de Alquiler de Consultorios

## Descripción del Objetivo
Crear un nuevo módulo "Local-First" que permita gestionar el alquiler de los 3 consultorios disponibles en la clínica. El alquiler se basará en turnos (Mañana/Tarde), y los ingresos generados deberán integrarse automáticamente con la contabilidad general del negocio. 

El enfoque principal será la simplicidad y facilidad de uso.

## Especificaciones Finales

- **Arrendatario:** Campo de texto libre con autocompletado para médicos registrados, permitiendo también el ingreso de médicos externos.
- **Consultorios:** Se utilizarán los nombres "Consultorio 1", "Consultorio 2" y "Consultorio 3".
- **Turnos:** Se incluyen tres modalidades: "MAÑANA", "TARDE" y "DÍA COMPLETO".
- **Contabilidad:** Registro automático en `contabilidad_asientos` como `INGRESO` / `ALQUILER_CONSULTORIO`.

## Cambios Propuestos

### 1. Base de Datos (`schema.sql` y `manager.js`)

#### [NEW] Nueva Tabla SQL
Crearemos una nueva tabla simple para registrar los alquileres sin complicar el esquema actual:

```sql
CREATE TABLE IF NOT EXISTS alquileres_consultorios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre_arrendatario TEXT NOT NULL,
  consultorio TEXT NOT NULL, -- "Consultorio 1", "Consultorio 2", "Consultorio 3"
  fecha DATE NOT NULL,
  turno TEXT CHECK(turno IN ('MAÑANA', 'TARDE', 'DÍA COMPLETO')) NOT NULL,
  precio_usd REAL NOT NULL,
  metodo_pago TEXT DEFAULT 'EFECTIVO_USD',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### [MODIFY] `src/db/manager.js`
- Agregar la función `registrarAlquiler(alquilerData)`: Esta función utilizará una **transacción ACID**. Primero, insertará el registro en la tabla `alquileres_consultorios`. Segundo, insertará automáticamente un asiento en `contabilidad_asientos` (Tipo: `INGRESO`, Categoría: `ALQUILER_CONSULTORIO`, con el método de pago seleccionado).
- Agregar función `obtenerAlquileres()` para listar el historial.
- Agregar función `eliminarAlquiler(id)` para revertir el alquiler y su respectivo asiento contable (por seguridad).

### 2. Lógica de Negocio

#### [NEW] `src/logic/alquilerService.js`
- Crearemos un servicio intermediario que maneje las llamadas a la base de datos (con fallback a `localStorage` para modo navegador de pruebas).
- Validará que no existan alquileres duplicados (ej. mismo consultorio, misma fecha, mismo turno).

### 3. Interfaz de Usuario (UI)

#### [NEW] `src/components/Rentals/RentalList.jsx`
- Un componente que mostrará una tabla con el historial de alquileres (Fecha, Consultorio, Turno, Arrendatario, Precio).
- Tendrá un botón principal de "➕ Registrar Alquiler".

#### [NEW] `src/components/Rentals/RentalForm.jsx`
- Un modal responsivo (Glassmorphism) para registrar el alquiler.
- **Campos:**
  - Arrendatario (Campo de texto, ej. "Dra. María - Ginecóloga")
  - Consultorio (Dropdown: Consultorio 1, Consultorio 2, Consultorio 3)
  - Fecha (Selector de fecha, por defecto hoy)
  - Turno (Dropdown: Mañana, Tarde, Día Completo)
  - Precio (USD) (Campo numérico, por defecto 20.00)
  - Método de Pago (Efectivo USD, Efectivo VES, Pago Móvil, etc.)

#### [MODIFY] `src/App.jsx`
- Añadiremos una nueva vista en el menú lateral: **"Consultorios"**. Estará ubicada en una sección lógica del menú izquierdo.

## Plan de Verificación
### Pruebas Unitarias Automatizadas
1. Crear `tests/unit/alquileres.test.js`.
2. Probar que al registrar un alquiler, el sistema efectivamente suma el dinero a la tabla de `contabilidad_asientos`.
3. Probar que el sistema rechace registrar un alquiler si faltan datos como el precio o el arrendatario.

### Verificación Manual
1. Abrir la App, ir a la nueva sección "Consultorios".
2. Registrar el alquiler del "Consultorio 1" en la "Mañana" por $20 en Efectivo USD.
3. Ir al módulo "Contabilidad" y verificar que la ganancia neta subió $20 y que se registra en el flujo diario.

---
**Estado:** En ejecución.
