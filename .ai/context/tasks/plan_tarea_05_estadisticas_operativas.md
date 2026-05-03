# Plan de Implementación: Estadísticas Operativas (Margen Bruto)

## ¿Es funcional o innecesario?
**Es EXTREMADAMENTE funcional y necesario.** 
En finanzas y contabilidad, lo que estás pidiendo se conoce como **"Margen Bruto"** o **"Margen de Contribución"**. 
Sirve para medir si los servicios médicos que ofreces son intrínsecamente rentables *antes* de pagar la estructura del negocio (alquiler, luz, secretarias, etc.). 
Si este margen es bajo o negativo, significa que cada paciente que atiendes te hace perder dinero sin importar cuántos pacientes tengas. Por lo tanto, tener estas 4 estadísticas a simple vista te da un control total sobre el "costo real de producción" de tus servicios.

## Cambios Propuestos

### 1. [MODIFY] `src/logic/reportService.js`
Actualmente, el dashboard calcula el resumen global mezclando todo (excepto cuando filtras por médico). Modificaremos `getDashboardStats` para que **siempre** calcule y retorne dos conjuntos de datos independientes en la misma llamada:
*   `kpisGlobales`: Toma en cuenta todos los ingresos y TODOS los egresos (fijos, operativos, etc.).
*   `kpisOperativos`: Toma los mismos ingresos, pero suma **únicamente** los egresos directos asociados al servicio (categorías: `PAGO_MEDICO`, `COSTO_INSUMO`, `COMISION`).
Con esto se calcularán los dos márgenes y los dos resultados netos simultáneamente.

### 2. [MODIFY] `src/components/Dashboard/KpiPanel.jsx`
Para mantener el diseño limpio ("glassmorphism") y no saturar la pantalla con 8 tarjetas gigantes:
*   Añadiremos un **"Toggle Switch"** (Interruptor) muy elegante en la parte superior del panel de KPIs con dos opciones: `Global` y `Operativo (Directo)`.
*   Al cambiar el interruptor, las tarjetas se animarán suavemente y cambiarán sus montos para reflejar el estado seleccionado.
*   Se ajustarán los subtítulos de las tarjetas (ej. el subtítulo de "Egresos Totales" cambiará a "Solo costos médicos y de insumos" cuando se active el modo Operativo).

### 3. [MODIFY] `src/components/Dashboard/Dashboard.jsx`
Actualizaremos cómo se pasan los datos desde el componente principal hacia el `KpiPanel` para soportar la nueva estructura doble (`kpisGlobales` y `kpisOperativos`).

## Verification Plan
1. **Automated Tests:** Correr la suite de `vitest` para asegurar que las funciones en `reportService.js` no rompan la compatibilidad hacia atrás en los reportes (especialmente en los tests de E2E).
2. **Visual Verification:** Renderizar el dashboard y alternar entre los modos "Global" y "Operativo" verificando que los montos de "Operativo" sean siempre gastos menores (al no incluir fijos) y que el margen operativo sea mayor que el margen neto global.

> [!IMPORTANT]  
> Lee mi explicación técnica arriba. Si estás de acuerdo con integrar el interruptor para ver ambas realidades de tu negocio, confírmame con **"Plan aprobado, procede con la implementación"**.
