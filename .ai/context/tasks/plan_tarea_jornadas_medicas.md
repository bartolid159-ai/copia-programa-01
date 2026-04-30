# Plan de Tarea: Módulo de Jornadas Médicas (Precios Promocionales)

Este plan detalla la implementación de un sistema de "Jornadas Médicas", el cual permite establecer precios reducidos para los servicios durante un período de tiempo específico, de forma automática y sin sobreescribir los precios base.

## 1. Análisis de Impacto y Cambios

### Backend y Lógica de Datos (Base de Datos / LocalStorage)
- **`src/db/manager.js`** y **`src/db/schema.sql`**:
    - Creación de dos nuevas tablas/estructuras:
        1. `jornadas`: Guarda los datos de la campaña (`id`, `nombre`, `fecha_inicio`, `fecha_fin`, `activa`).
        2. `jornadas_servicios`: Relaciona la jornada con los servicios que entran en promoción (`id_jornada`, `id_servicio`, `precio_oferta_usd`).
    - Métodos CRUD para gestionar las jornadas y sus servicios asociados.
    - Adaptación para modo Navegador (`localStorage`: `clinica_jornadas_db` y `clinica_jornadas_servicios_db`).

- **`src/logic/serviceLogic.js`**:
    - Se modificará la función `getServices()` para que verifique si existe una **Jornada Activa** (basado en la fecha actual y la bandera `activa`).
    - Si hay una jornada activa, interceptará los servicios y reemplazará temporalmente su `precio_usd` por el `precio_oferta_usd` (siempre y cuando el servicio esté en la promoción).
    - Esto garantiza que todo el sistema (especialmente el módulo de Facturación) use automáticamente el nuevo precio sin alterar la lógica de facturación existente.

### Interfaz de Usuario (UI)
- **`src/components/Jornadas/JornadaPanel.jsx`** (NUEVO):
    - Panel para listar las jornadas actuales, pasadas y futuras.
    - Permite crear o editar jornadas.
- **`src/components/Jornadas/JornadaForm.jsx`** (NUEVO):
    - Formulario para establecer `nombre`, `fecha_inicio`, `fecha_fin`.
    - Un selector múltiple de servicios donde se pueda especificar el "Precio de Oferta" para cada servicio seleccionado.
- **`src/App.jsx`**:
    - Integrar un botón "Promociones/Jornadas" en el menú lateral o dentro del panel de "Servicios" para acceder al gestor.

## 2. Nuevos Archivos / Modificaciones

| Archivo | Acción | Descripción |
|---|---|---|
| `src/db/manager.js` | Modificar | Añadir lógica SQL y LocalStorage para Jornadas. |
| `src/logic/serviceLogic.js` | Modificar | Intercepción de precios si hay jornada activa. |
| `src/components/Jornadas/JornadaPanel.jsx` | Crear | UI de administración de Jornadas. |
| `src/components/Jornadas/JornadaForm.jsx` | Crear | Formulario para configurar fechas y precios de la jornada. |
| `src/App.jsx` | Modificar | Enlace en el menú lateral para acceder a "Jornadas". |
| `tests/unit/Jornadas.test.jsx` | Crear | Validar que el precio de un servicio cambie automáticamente durante una jornada activa y vuelva a su precio base al finalizar. |

## 3. Lógica de Implementación (Núcleo)

### Modificación de los Servicios
```javascript
export const getServices = async () => {
  const db = await getDbManager();
  const servicios = db.getAllServicios();
  const jornadaActiva = db.getActiveJornada(new Date().toISOString().split('T')[0]);
  
  if (jornadaActiva) {
    const serviciosPromo = db.getServiciosPorJornada(jornadaActiva.id);
    return servicios.map(s => {
      const promo = serviciosPromo.find(p => p.id_servicio === s.id);
      return promo ? { ...s, precio_usd: promo.precio_oferta_usd, es_promocion: true } : s;
    });
  }
  return servicios;
};
```
Esta lógica garantiza "cero interrupciones" (zero friction) con el resto del sistema. Las facturas usarán el precio promocional y lo guardarán en `factura_detalles` de forma inmutable, por lo que el historial contable será exacto.

## 4. Definición de Tests (Vitest)
1. **Test de Precios Dinámicos**: Crear un servicio base a 50$, crear una jornada a 30$. Simular una fecha dentro de la jornada y verificar que `getServices` devuelve 30$. Simular una fecha posterior y verificar que vuelve a 50$.
2. **Test de CRUD Jornadas**: Probar la creación, activación y desactivación manual de una campaña.

---
**DETENCIÓN OBLIGATORIA**: Por favor, revisa este plan. Una vez aprobado, procederé con la ejecución atómica.
